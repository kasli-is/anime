from datetime import time
import os
import sys
import json
import sqlite3
import urllib.request
import urllib.parse
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get('PORT', 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'turkanime.db')
MIRROR_DIR = os.path.join(BASE_DIR, 'mirror', 'animeler')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

def ensure_db():
    if not os.path.isfile(DB_PATH):
        db_url = os.environ.get('DB_DOWNLOAD_URL', '').strip()
        if db_url:
            print(f"[Veritabanı] {DB_PATH} bulunamadı. DB_DOWNLOAD_URL üzerinden indiriliyor...")
            try:
                urllib.request.urlretrieve(db_url, DB_PATH)
                print(f"[Veritabanı] İndirme başarılı ({os.path.getsize(DB_PATH)} bytes).")
            except Exception as e:
                print(f"[Veritabanı Hata] İndirme başarısız: {e}")
        else:
            print(f"[Uyarı] {DB_PATH} bulunamadı. Lütfen veritabanı dosyasını yükleyin veya DB_DOWNLOAD_URL tanımlayın.")

# In-memory info & cover cache (NO permanent disk files)
INFO_CACHE = {}
COVER_URL_CACHE = {}

# Genre index: maps genre_name_lower -> set of anime slugs
GENRE_INDEX = {}
GENRE_COUNTS = {}  # genre_name -> count (original casing)

# Anime metadata cache (slug -> dict of score, genres, category, summary, studio, etc.)
ANIME_META = {}
ANIME_META_FILE = os.path.join(BASE_DIR, 'anime_meta.json')
GENRE_INDEX_FILE = os.path.join(BASE_DIR, 'genre_index.json')

def build_genre_index():
    """Builds genre index and anime metadata from mirror directory and saves to json files for Render"""
    global GENRE_INDEX, GENRE_COUNTS, ANIME_META
    idx = {}
    counts = {}
    meta = {}

    # 1. If mirror exists locally, build and export anime_meta.json & genre_index.json
    if os.path.isdir(MIRROR_DIR):
        for slug in os.listdir(MIRROR_DIR):
            info_path = os.path.join(MIRROR_DIR, slug, 'info.json')
            if not os.path.isfile(info_path):
                continue
            try:
                with open(info_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    genres = data.get('Anime Türü', [])
                    for g in genres:
                        gl = g.lower().strip()
                        if not gl:
                            continue
                        if gl not in idx:
                            idx[gl] = set()
                            counts[gl] = {'name': g, 'count': 0}
                        idx[gl].add(slug)
                        counts[gl]['count'] += 1

                    # Keep all anime details for score, category, summary, dates, etc.
                    meta[slug] = {
                        'score': data.get('Puanı'),
                        'category': data.get('Kategori', 'TV'),
                        'genres': genres,
                        'japanese': data.get('Japonca', ''),
                        'start_date': data.get('Başlama Tarihi', ''),
                        'end_date': data.get('Bitiş Tarihi', ''),
                        'studio': data.get('Stüdyo', ''),
                        'summary': data.get('Özet', '')
                    }
            except Exception:
                pass
        GENRE_INDEX = idx
        GENRE_COUNTS = counts
        ANIME_META = meta
        print(f"[Tür İndeksi] {len(GENRE_INDEX)} tür, {len(ANIME_META)} anime metadata indekslendi.")
        
        # Save to json files for production deployment
        try:
            serializable = {
                'counts': counts,
                'index': {k: list(v) for k, v in idx.items()}
            }
            with open(GENRE_INDEX_FILE, 'w', encoding='utf-8') as f:
                json.dump(serializable, f, ensure_ascii=False)
            with open(ANIME_META_FILE, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False)
            print(f"[Meta] {ANIME_META_FILE} ve {GENRE_INDEX_FILE} dosyalarına kaydedildi.")
        except Exception as e:
            print(f"[Meta Kayıt Hata] {e}")
        return

    # 2. If mirror does not exist (Render production), load precomputed files
    if os.path.isfile(GENRE_INDEX_FILE):
        try:
            with open(GENRE_INDEX_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                GENRE_COUNTS = data.get('counts', {})
                GENRE_INDEX = {k: set(v) for k, v in data.get('index', {}).items()}
        except Exception as e:
            print(f"[Tür İndeksi Yükleme Hata] {e}")

    if os.path.isfile(ANIME_META_FILE):
        try:
            with open(ANIME_META_FILE, 'r', encoding='utf-8') as f:
                ANIME_META = json.load(f)
            print(f"[Meta] {len(ANIME_META)} anime metadata yüklendi.")
        except Exception as e:
            print(f"[Meta Yükleme Hata] {e}")

def clean_anime_title(title):
    if not title:
        return ""
    t = title.replace('☆', ' ').replace('★', ' ').replace('!', ' ').replace('_', ' ')
    t = t.split('(')[0].split(':')[0].strip()
    return t

def resolve_cover_url(slug, title):
    if slug and slug in COVER_URL_CACHE and COVER_URL_CACHE[slug]:
        return COVER_URL_CACHE[slug]
    if title and title in COVER_URL_CACHE and COVER_URL_CACHE[title]:
        return COVER_URL_CACHE[title]

    q = clean_anime_title(title or slug)
    if not q:
        return None

    # 1. Kitsu Edge API
    try:
        url = f"https://kitsu.io/api/edge/anime?filter[text]={urllib.parse.quote(q)}&page[limit]=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                items = data.get('data', [])
                if items:
                    p = items[0].get('attributes', {}).get('posterImage', {})
                    # Prioritize high resolution (large / original / medium)
                    img = p.get('large') or p.get('original') or p.get('medium') or p.get('small')
                    if img:
                        if slug: COVER_URL_CACHE[slug] = img
                        if title: COVER_URL_CACHE[title] = img
                        return img
    except Exception:
        pass

    # 2. AniList GraphQL API (Fallback)
    try:
        query_gql = """
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            coverImage {
              extraLarge
              large
              medium
            }
          }
        }
        """
        payload = json.dumps({'query': query_gql, 'variables': {'search': q}}).encode('utf-8')
        req = urllib.request.Request(
            'https://graphql.anilist.co',
            data=payload,
            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=4) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                cov = data.get('data', {}).get('Media', {}).get('coverImage', {})
                img = cov.get('extraLarge') or cov.get('large') or cov.get('medium')
                if img:
                    if slug: COVER_URL_CACHE[slug] = img
                    if title: COVER_URL_CACHE[title] = img
                    return img
    except Exception:
        pass

    return None

def fix_poster_url(slug, title):
    if slug and slug in COVER_URL_CACHE and COVER_URL_CACHE[slug]:
        return COVER_URL_CACHE[slug]
    if title and title in COVER_URL_CACHE and COVER_URL_CACHE[title]:
        return COVER_URL_CACHE[title]
    return f"/api/cover?slug={urllib.parse.quote(slug)}&title={urllib.parse.quote(title or '')}"

def get_anime_info(slug):
    if slug in INFO_CACHE:
        return INFO_CACHE[slug]
    info_path = os.path.join(MIRROR_DIR, slug, 'info.json')
    if os.path.exists(info_path):
        try:
            with open(info_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                INFO_CACHE[slug] = data
                return data
        except Exception:
            pass

    # Fallback to precomputed ANIME_META (for Render cloud)
    if slug in ANIME_META:
        m = ANIME_META[slug]
        return {
            'Puanı': m.get('score'),
            'Kategori': m.get('category', 'TV'),
            'Anime Türü': m.get('genres', []),
            'Japonca': m.get('japanese', ''),
            'Başlama Tarihi': m.get('start_date', ''),
            'Bitiş Tarihi': m.get('end_date', ''),
            'Stüdyo': m.get('studio', ''),
            'Özet': m.get('summary', '')
        }

    return None

def get_db_connection():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

class AnimeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/'):
            try:
                self.handle_api(path, query)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # Serve static files from PUBLIC_DIR
        # Fallback to index.html for root or missing non-file paths
        file_path = os.path.join(PUBLIC_DIR, path.lstrip('/'))
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.path = '/index.html'

        return super().do_GET()

    def handle_api(self, path, query):
        if path == '/api/animes':
            self.api_animes(query)
        elif path.startswith('/api/anime/') and path.endswith('/episodes'):
            slug = path.split('/')[3]
            self.api_anime_episodes(slug)
        elif path.startswith('/api/anime/') and path.endswith('/related'):
            slug = path.split('/')[3]
            self.api_related_anime(slug)
        elif path.startswith('/api/anime/'):
            slug = path.split('/')[3]
            self.api_anime_detail(slug)
        elif path == '/api/genres':
            self.api_genres()
        elif path == '/api/stream/sibnet':
            self.api_stream_sibnet(query)
        elif path == '/api/resolve':
            self.api_resolve_stream(query)
        elif path == '/api/cover':
            self.api_cover_proxy(query)
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Endpoint not found'}).encode('utf-8'))

    def api_animes(self, query):
        q = query.get('q', [''])[0].strip()
        genre = query.get('genre', [''])[0].strip()
        sort = query.get('sort', ['popular'])[0]
        page = max(1, int(query.get('page', ['1'])[0]))
        limit = min(60, max(12, int(query.get('limit', ['24'])[0])))
        offset = (page - 1) * limit

        con = get_db_connection()
        cur = con.cursor()

        sql = "SELECT id, slug, baslik, bolum_sayisi FROM anime WHERE 1=1"
        params = []

        if q:
            sql += " AND (baslik LIKE ? OR slug LIKE ?)"
            params.extend([f"%{q}%", f"%{q}%"])

        # Genre pre-filter: use GENRE_INDEX to get matching slugs BEFORE SQL
        if genre:
            genre_slugs = GENRE_INDEX.get(genre.lower(), set())
            if not genre_slugs:
                # No anime matches this genre
                con.close()
                self.send_json({'total': 0, 'page': page, 'limit': limit, 'items': []})
                return
            # Build IN clause with placeholders
            placeholders = ','.join('?' for _ in genre_slugs)
            sql += f" AND slug IN ({placeholders})"
            params.extend(list(genre_slugs))

        # Sorting
        if sort == 'az':
            sql += " ORDER BY baslik ASC"
        elif sort == 'za':
            sql += " ORDER BY baslik DESC"
        elif sort == 'episodes':
            sql += " ORDER BY bolum_sayisi DESC"
        else: # popular / default
            sql += " ORDER BY bolum_sayisi DESC, baslik ASC"

        # Count total (now includes genre filter!)
        count_sql = f"SELECT COUNT(*) FROM ({sql})"
        cur.execute(count_sql, params)
        total = cur.fetchone()[0]

        sql += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cur.execute(sql, params)
        rows = cur.fetchall()
        con.close()

        items = []
        for r in rows:
            slug = r['slug']
            info = get_anime_info(slug) or {}
            anime_genres = info.get('Anime Türü', [])

            items.append({
                'id': r['id'],
                'slug': slug,
                'title': r['baslik'],
                'episodes_count': r['bolum_sayisi'],
                'poster': fix_poster_url(slug, r['baslik']),
                'score': info.get('Puanı'),
                'category': info.get('Kategori', 'TV'),
                'genres': anime_genres[:3],
                'summary': (info.get('Özet') or '')[:140] + '...' if info.get('Özet') else ''
            })

        self.send_json({
            'total': total,
            'page': page,
            'limit': limit,
            'items': items
        })

    def api_anime_detail(self, slug):
        con = get_db_connection()
        cur = con.cursor()
        cur.execute("SELECT id, slug, baslik, bolum_sayisi FROM anime WHERE slug = ? LIMIT 1", (slug,))
        row = cur.fetchone()
        con.close()

        if not row:
            self.send_response(404)
            self.send_json({'error': 'Anime bulunamadı'})
            return

        info = get_anime_info(slug) or {}
        res = {
            'id': row['id'],
            'slug': row['slug'],
            'title': row['baslik'],
            'episodes_count': row['bolum_sayisi'],
            'japanese_title': info.get('Japonca', ''),
            'category': info.get('Kategori', 'TV'),
            'genres': info.get('Anime Türü', []),
            'start_date': info.get('Başlama Tarihi', ''),
            'end_date': info.get('Bitiş Tarihi', ''),
            'studio': info.get('Stüdyo', ''),
            'score': info.get('Puanı'),
            'summary': info.get('Özet', ''),
            'poster': fix_poster_url(slug, row['baslik'])
        }
        self.send_json(res)

    def api_anime_episodes(self, slug):
        con = get_db_connection()
        cur = con.cursor()
        cur.execute("""
            SELECT b.id as bolum_id, b.slug as bolum_slug, b.ad as bolum_ad,
                   l.player, l.fansub, l.tip, l.deger
            FROM anime a
            JOIN bolum b ON b.anime_id = a.id
            LEFT JOIN link l ON l.bolum_id = b.id
            WHERE a.slug = ?
            ORDER BY b.id ASC
        """, (slug,))
        rows = cur.fetchall()
        con.close()

        def calculate_source_score(player, url):
            p = (player or '').upper()
            u = (url or '').strip().lower()

            if u.startswith('http://') or u.startswith('https://'):
                score = 10000
            else:
                return -10000  # Dead internal relative links (/player/...)

            if 'sibnet' in p or 'sibnet.ru' in u:
                score += 1000  # Native HTML5 direct stream, fast seek, no ads
            elif 'odnoklassniki' in p or 'ok.ru' in p or 'ok.ru' in u or 'odnoklassniki' in u:
                score += 850   # Super reliable Russian embed, 1080p-360p
            elif 'mail' in p or 'mail.ru' in u:
                score += 800   # Mail.ru cloud embed, high stability
            elif 'mp4upload' in p or 'mp4upload' in u:
                score += 750   # Dedicated anime video host
            elif 'sendvid' in p or 'sendvid' in u:
                score += 700   # Clean embed, stable
            elif 'uqload' in p or 'uqload' in u:
                score += 650   # Fast streaming
            elif 'dailymotion' in p or 'dailymotion' in u:
                score += 620   # Official platform
            elif p == 'VK' or 'vk.com' in u:
                score += 600   # VK video player
            elif 'mega' in p or 'mega.nz' in u:
                score += 580   # MEGA cloud
            elif 'voe' in p or 'voe.sx' in u:
                score += 540
            elif 'filemoon' in p or 'filemoon' in u:
                score += 520
            elif any(k in p.lower() for k in ['streamsb', 'sbstream', 'streamwish', 'vidhide']):
                score += 480
            elif 'dood' in p.lower() or 'dood' in u:
                score += 460
            elif any(k in p.lower() for k in ['vudea', 'clone', 'tubeload', 'embedo', 'mvidoo', 'videa', 'yadisk', 'youtube', 'yourupload']):
                score += 400
            elif 'gdrive' in p.lower() or 'google' in u:
                score += 150   # Often rate-limited by Google quota or DMCA
            else:
                score += 250

            return score

        episodes_map = {}
        for r in rows:
            b_id = r['bolum_id']
            if b_id not in episodes_map:
                episodes_map[b_id] = {
                    'id': b_id,
                    'slug': r['bolum_slug'],
                    'name': r['bolum_ad'],
                    'links': []
                }

            # Only include valid links with urls
            if r['deger'] and r['tip'] == 'url':
                player_name = r['player'] or 'Bilinmeyen'
                episodes_map[b_id]['links'].append({
                    'player': player_name,
                    'fansub': r['fansub'] or 'Varsayılan',
                    'url': r['deger'],
                    'can_stream': (player_name.upper() == 'SIBNET')
                })

        # Sort links for every episode so the most reliable/working sources are first
        for ep in episodes_map.values():
            all_links = ep['links']
            http_links = [l for l in all_links if (l.get('url') or '').startswith('http://') or (l.get('url') or '').startswith('https://')]
            candidate_links = http_links if http_links else all_links
            candidate_links.sort(key=lambda l: calculate_source_score(l['player'], l['url']), reverse=True)
            ep['links'] = candidate_links

        episodes = list(episodes_map.values())
        self.send_json({'slug': slug, 'count': len(episodes), 'episodes': episodes})

    def api_genres(self):
        """Returns real genres from data, sorted by frequency (most popular first)"""
        if not GENRE_COUNTS:
            # Fallback if index not built yet
            build_genre_index()
        # Sort by count descending, return original-cased genre names
        sorted_genres = sorted(GENRE_COUNTS.values(), key=lambda x: -x['count'])
        genres = [g['name'] for g in sorted_genres if g['count'] >= 5]  # Skip very rare genres
        self.send_json(genres)

    def api_related_anime(self, slug):
        """Finds related anime (seasons, movies, OVAs) by extracting base name from slug"""
        # Extract base name: remove season/part suffixes
        base = slug
        # Remove common suffixes to find the base anime slug
        suffixes_to_strip = [
            r'-(?:the-)?final-season.*', r'-\d+(?:st|nd|rd|th)-season.*',
            r'-season-\d+.*', r'-part-\d+.*', r'-[ivx]+-(?:season|part).*',
            r'-(?:ii|iii|iv|v|vi|vii)$', r'-(?:ii|iii|iv|v|vi|vii)-.*',
            r'-2nd-season.*', r'-3rd-season.*', r'-4th-season.*',
            r'-5th-season.*', r'-6th-season.*', r'-7th-season.*',
            r'-movie(?:-\d+)?.*', r'-ova.*', r'-ona.*', r'-specials?$',
            r'-picture-drama.*', r'-chronicle$',
        ]
        for pattern in suffixes_to_strip:
            candidate = re.sub(pattern, '', base)
            if candidate != base and len(candidate) >= 3:
                base = candidate
                break

        con = get_db_connection()
        cur = con.cursor()
        # Find all anime whose slug starts with the base name
        cur.execute(
            "SELECT id, slug, baslik, bolum_sayisi FROM anime WHERE slug LIKE ? ORDER BY baslik ASC",
            (f"{base}%",)
        )
        rows = cur.fetchall()
        con.close()

        if len(rows) <= 1:
            # No related entries found
            self.send_json({'base_slug': base, 'related': []})
            return

        def get_season_order(s, cat):
            """Assigns a permanent, fixed canonical sort key so cards NEVER change order when selected"""
            name = s.lower()
            cat_lower = (cat or '').lower()

            # Movies first check
            if 'movie' in name or cat_lower in ['film', 'movie']:
                m = re.search(r'movie(?:-(\d+))?', name)
                num = int(m.group(1)) if m and m.group(1) else 1
                return (2, num, 0, s)

            # Specials / OVA / ONA / Recap / Picture Drama / Lost Girls
            if cat_lower in ['ova', 'ona', 'special'] or any(k in name for k in ['ova', 'ona', 'special', 'picture-drama', 'lost-girls', 'recap', 'chronicle', 'hero-note']):
                return (3, 0, 0, s)

            # Main canonical series (base) is always first
            if s == base:
                return (0, 0, 0, s)

            # Numbered seasons (e.g. 2nd-season, season-2)
            m = re.search(r'(\d+)(?:st|nd|rd|th)-season', name)
            if m:
                p = re.search(r'part-(\d+)', name)
                part = int(p.group(1)) if p else 0
                return (1, int(m.group(1)), part, s)
            m = re.search(r'season-(\d+)', name)
            if m:
                p = re.search(r'part-(\d+)', name)
                part = int(p.group(1)) if p else 0
                return (1, int(m.group(1)), part, s)

            # Roman numeral sequels (II, III, IV...)
            roman_map = {'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7}
            for roman, num in roman_map.items():
                if name.endswith(f'-{roman}') or f'-{roman}-' in name:
                    p = re.search(r'part-(\d+)', name)
                    part = int(p.group(1)) if p else 0
                    return (1, num, part, s)

            # Final season (e.g. the-final-season, final-season-part-2, kanketsu-hen)
            if 'final-season' in name or 'final' in name:
                p = re.search(r'part-(\d+)', name)
                part = int(p.group(1)) if p else (3 if 'kanketsu-hen' in name else 0)
                return (1, 90, part, s)

            # "Part 2", "Part 3" without explicit season word
            m = re.search(r'part-(\d+)', name)
            if m:
                return (1, 50 + int(m.group(1)), 0, s)

            # Other related TV entries
            return (1, 80, 0, s)

        related = []
        for r in rows:
            info = get_anime_info(r['slug']) or {}
            category = info.get('Kategori', 'TV')
            name_lower = r['slug'].lower()
            cat_lower = category.lower()

            if 'movie' in name_lower or cat_lower in ['film', 'movie']:
                entry_type = 'Film'
            elif 'ova' in name_lower or cat_lower == 'ova' or 'lost-girls' in name_lower:
                entry_type = 'OVA'
            elif 'ona' in name_lower or cat_lower == 'ona':
                entry_type = 'ONA'
            elif 'special' in name_lower or 'picture-drama' in name_lower or 'hero-note' in name_lower or cat_lower == 'special':
                entry_type = 'Special'
            else:
                entry_type = 'TV'

            related.append({
                'slug': r['slug'],
                'title': r['baslik'],
                'episodes_count': r['bolum_sayisi'],
                'poster': fix_poster_url(r['slug'], r['baslik']),
                'category': category,
                'type': entry_type,
                '_sort': get_season_order(r['slug'], category)
            })

        related.sort(key=lambda x: x['_sort'])
        for r in related:
            del r['_sort']

        self.send_json({'base_slug': base, 'current': slug, 'related': related})

    def api_resolve_stream(self, query):
        """Resolves direct stream url from third party if possible (e.g. Sibnet)"""
        url = query.get('url', [''])[0].strip()
        if not url:
            self.send_json({'success': False, 'error': 'URL required'})
            return

        if 'sibnet.ru' in url:
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': url}
                req = urllib.request.Request(url, headers=headers)
                html = urllib.request.urlopen(req, timeout=6).read().decode('utf-8', errors='ignore')
                match = re.search(r'src:\s*["\'](/v/[^"\']+\.mp4)["\']', html)
                if match:
                    mp4_path = match.group(1)
                    direct_url = f"/api/stream/sibnet?src={urllib.parse.quote(mp4_path)}&ref={urllib.parse.quote(url)}"
                    self.send_json({'success': True, 'type': 'mp4', 'stream_url': direct_url})
                    return
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
                return

        self.send_json({'success': False, 'type': 'iframe', 'url': url})

    def api_stream_sibnet(self, query):
        """Proxies Sibnet video chunks with HTTP 206 Partial Content for HTML5 seeking"""
        src = query.get('src', [''])[0].strip()
        ref = query.get('ref', [''])[0].strip()

        if not src:
            self.send_response(400)
            self.end_headers()
            return

        video_url = f"https://video.sibnet.ru{src}"
        req_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': ref or 'https://video.sibnet.ru/'
        }

        # Forward client Range header if present
        range_header = self.headers.get('Range')
        if range_header:
            req_headers['Range'] = range_header

        req = urllib.request.Request(video_url, headers=req_headers)
        try:
            res = urllib.request.urlopen(req, timeout=12)
            status = res.status
            self.send_response(status)

            for h, v in res.headers.items():
                if h.lower() in ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']:
                    self.send_header(h, v)

            # Enable CORS and caching
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()

            # Stream chunks
            while True:
                chunk = res.read(64 * 1024)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    break
        except Exception as e:
            if not self.wfile.closed:
                try:
                    self.send_response(502)
                    self.end_headers()
                except Exception:
                    pass

    def api_cover_proxy(self, query):
        slug = query.get('slug', [''])[0].strip()
        title = query.get('title', [''])[0].strip()

        # 1. Memory lookup / on-demand resolve (zero disk storage)
        img_url = resolve_cover_url(slug, title)
        if img_url:
            # 302 Found redirect directly to CDN (media.kitsu.app or anilistcdn)
            # Browser loads directly into memory cache without saving files to disk!
            self.send_response(302)
            self.send_header('Location', img_url)
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return

        # 2. Clean SVG Fallback Poster
        display_title = (title or slug or 'Anime')[:16]
        svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='300' height='420' viewBox='0 0 300 420'>
  <defs>
    <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#1e293b'/>
      <stop offset='100%' stop-color='#0f172a'/>
    </linearGradient>
  </defs>
  <rect width='300' height='420' rx='12' fill='url(#g)'/>
  <circle cx='150' cy='180' r='48' fill='#334155' opacity='0.4'/>
  <polygon points='142,164 170,180 142,196' fill='#818cf8'/>
  <text x='150' y='275' fill='#cbd5e1' font-size='16' font-family='sans-serif' font-weight='bold' text-anchor='middle'>{display_title}</text>
</svg>""".encode('utf-8')

        self.send_response(200)
        self.send_header('Content-Type', 'image/svg+xml')
        self.send_header('Cache-Control', 'public, max-age=3600')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(svg)

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

def preload_popular_covers():
    """Preloads popular anime posters into memory in background (zero disk writes)"""
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute("SELECT slug, baslik FROM anime ORDER BY bolum_sayisi DESC, baslik ASC LIMIT 100")
        rows = cur.fetchall()
        con.close()

        def fetch(item):
            resolve_cover_url(item[0], item[1])

        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(fetch, rows))
        print(f"[Kapak Ön Belleği] {len(COVER_URL_CACHE)} anime afiş adresi belleğe yüklendi (disk kullanılmadı).")
    except Exception as e:
        print("[Kapak Ön Belleği]", e)

def free_port(port):
    """Kills any process currently listening on port so server can start cleanly"""
    try:
        import subprocess
        out = subprocess.check_output(f'netstat -ano | findstr :{port} | findstr LISTENING', shell=True).decode('utf-8', errors='ignore')
        for line in out.strip().splitlines():
            parts = line.strip().split()
            if parts:
                pid = int(parts[-1])
                if pid != os.getpid():
                    print(f"[Port Temizleme] Port {port} üzerindeki eski işlem ({pid}) kapatılıyor...")
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
        time.sleep(1)
    except Exception as e:
        pass

def run():
    os.chdir(BASE_DIR)
    ensure_db()
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    server_address = ('', PORT)
    ThreadingHTTPServer.allow_reuse_address = True
    
    httpd = None
    for attempt in range(2):
        try:
            httpd = ThreadingHTTPServer(server_address, AnimeHandler)
            break
        except OSError as e:
            if attempt == 0:
                print(f"[Bilgi] Port {PORT} meşgul, temizlenip yeniden deneniyor...")
                free_port(PORT)
            else:
                print(f"\n[HATA] Port {PORT} bağlanamadı: {e}")
                print(f"Lütfen port {PORT}'i kullanan diğer uygulamayı kapatın.\n")
                sys.exit(1)

    print(f"TürkAnime Sunucusu çalışıyor: http://localhost:{PORT}")
    
    # Build genre index on startup (fast, ~1-2s)
    build_genre_index()
    
    # Launch background memory preloader
    threading.Thread(target=preload_popular_covers, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatılıyor...")
        httpd.server_close()

if __name__ == '__main__':
    run()
