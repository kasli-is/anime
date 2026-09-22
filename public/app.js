/**
 * TürkAnime Arşivi - Mobil Uyumlu Web Arayüzü & Dokunmatik Video Oynatıcı
 */

// ==========================================
// STATE MANAGEMENT
// ==========================================
const State = {
  page: 1,
  limit: 24,
  total: 0,
  genre: '',
  sort: 'popular',
  query: '',

  // Active viewing
  currentAnime: null,
  currentEpisodes: [],
  activeEpisodeIndex: 0,
  activeLinkIndex: 0,
  activeBatchIndex: 0,

  // Player state
  playerMode: 'native', // 'native' or 'iframe'
  userSpeed: 1.0,
  isHolding2X: false,
  holdTimeout: null,
  isScrubbing: false,
  controlsTimeout: null,
  controlsVisible: true,

  // Storage
  favorites: new Set(), // Set of anime slugs
  favoriteEpisodes: {}, // Map of 'animeSlug_epSlug' -> episode object
  favTab: 'animes', // 'animes' or 'episodes'
  history: [],
  episodeTimes: {}
};

// Storage Keys
const STORAGE_FAVS = 'turkanime_favorites_v1';
const STORAGE_FAV_EPISODES = 'turkanime_fav_episodes_v1';
const STORAGE_HISTORY = 'turkanime_history_v1';
const STORAGE_EPISODE_TIMES = 'turkanime_ep_times_v1';
const STORAGE_VOLUME = 'turkanime_volume_v1';

// ==========================================
// DOM ELEMENTS
// ==========================================
const DOM = {
  navbar: document.getElementById('navbar'),
  btnHome: document.getElementById('btn-home'),
  navCatalog: document.getElementById('nav-btn-catalog'),
  navHistory: document.getElementById('nav-btn-history'),
  navFavorites: document.getElementById('nav-btn-favorites'),
  historyBadge: document.getElementById('history-badge'),
  favBadge: document.getElementById('fav-badge'),

  globalSearch: document.getElementById('global-search'),
  clearSearch: document.getElementById('clear-search'),

  // Shelves
  sectionHistory: document.getElementById('section-history'),
  historyGrid: document.getElementById('history-grid'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  // Favorites Modal
  favoritesModal: document.getElementById('favorites-modal'),
  btnCloseFavorites: document.getElementById('btn-close-favorites'),
  tabFavAnimes: document.getElementById('tab-fav-animes'),
  tabFavEpisodes: document.getElementById('tab-fav-episodes'),
  favAnimeCount: document.getElementById('fav-anime-count'),
  favEpCount: document.getElementById('fav-ep-count'),
  favoritesAnimesGrid: document.getElementById('favorites-animes-grid'),
  favoritesEpisodesGrid: document.getElementById('favorites-episodes-grid'),

  // Catalog
  sectionCatalog: document.getElementById('section-catalog'),
  genresContainer: document.getElementById('genres-container'),
  btnGenreLeft: document.getElementById('btn-genre-left'),
  btnGenreRight: document.getElementById('btn-genre-right'),
  sortSelect: document.getElementById('sort-select'),
  resultsCount: document.getElementById('results-count'),
  animeGrid: document.getElementById('anime-grid'),
  btnFirstPage: document.getElementById('btn-first-page'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  btnLastPage: document.getElementById('btn-last-page'),
  pageJumpInput: document.getElementById('page-jump-input'),
  btnGoPage: document.getElementById('btn-go-page'),
  pageInfo: document.getElementById('page-info'),

  // Search Dropdown
  searchDropdown: document.getElementById('search-dropdown'),
  searchDropdownResults: document.getElementById('search-dropdown-results'),
  searchDropdownFooter: document.getElementById('search-dropdown-footer'),

  // Detail Modal
  detailModal: document.getElementById('detail-modal'),
  btnCloseDetail: document.getElementById('btn-close-detail'),
  detailPoster: document.getElementById('detail-poster'),
  detailFavBtn: document.getElementById('detail-fav-btn'),
  detailCategory: document.getElementById('detail-category'),
  detailTitle: document.getElementById('detail-title'),
  detailJpTitle: document.getElementById('detail-jp-title'),
  detailScore: document.getElementById('detail-score'),
  detailEpCount: document.getElementById('detail-ep-count'),
  detailStudio: document.getElementById('detail-studio'),
  detailDates: document.getElementById('detail-dates'),
  detailGenres: document.getElementById('detail-genres'),
  detailSummary: document.getElementById('detail-summary'),
  episodesBadge: document.getElementById('episodes-badge'),
  episodeFilterInput: document.getElementById('episode-filter-input'),
  episodesBatchTabs: document.getElementById('episodes-batch-tabs'),
  episodesGrid: document.getElementById('episodes-grid'),
  relatedSeasonsSection: document.getElementById('related-seasons-section'),
  relatedSeasonsGrid: document.getElementById('related-seasons-grid'),

  // Video Player Modal
  playerModal: document.getElementById('player-modal'),
  playerWrapper: document.getElementById('player-wrapper'),
  btnClosePlayer: document.getElementById('btn-close-player'),
  playerAnimeName: document.getElementById('player-anime-name'),
  playerEpName: document.getElementById('player-ep-name'),
  btnPlayerFavEp: document.getElementById('btn-player-fav-ep'),
  btnMiniPlayer: document.getElementById('btn-mini-player'),
  btnTheaterMode: document.getElementById('btn-theater-mode'),
  btnHotkeys: document.getElementById('btn-hotkeys'),
  btnExternalLink: document.getElementById('btn-external-link'),
  btnCenterPlay: document.getElementById('btn-center-play'),
  centerIconPlay: document.querySelector('.center-icon-play'),
  centerIconPause: document.querySelector('.center-icon-pause'),

  // Player Screen & Native Video
  playerScreenContainer: document.getElementById('player-screen-container'),
  nativeContainer: document.getElementById('native-player-container'),
  nativeVideo: document.getElementById('native-video'),
  gestureLeft: document.getElementById('gesture-left'),
  gestureCenter: document.getElementById('gesture-center'),
  gestureRight: document.getElementById('gesture-right'),
  rippleLeft: document.getElementById('ripple-left'),
  rippleRight: document.getElementById('ripple-right'),
  playPulse: document.getElementById('play-pulse'),
  speedHoldBadge: document.getElementById('speed-hold-badge'),
  speedHoldBadgeText: document.getElementById('speed-hold-badge-text'),
  resumeBubble: document.getElementById('resume-bubble'),
  resumeText: document.getElementById('resume-text'),
  bufferingSpinner: document.getElementById('buffering-spinner'),
  playerControlsBar: document.getElementById('player-controls-bar'),

  // Controls
  progressContainer: document.getElementById('progress-container'),
  progressHoverTime: document.getElementById('progress-hover-time'),
  progressBuffered: document.getElementById('progress-buffered'),
  progressPlayed: document.getElementById('progress-played'),
  progressScrubber: document.getElementById('progress-scrubber'),
  ctrlPlayPause: document.getElementById('ctrl-play-pause'),
  iconPlay: document.querySelector('.icon-play'),
  iconPause: document.querySelector('.icon-pause'),
  ctrlRewind: document.getElementById('ctrl-rewind'),
  ctrlForward: document.getElementById('ctrl-forward'),
  ctrlMute: document.getElementById('ctrl-mute'),
  iconVolHigh: document.querySelector('.icon-vol-high'),
  iconVolMute: document.querySelector('.icon-vol-mute'),
  ctrlVolumeSlider: document.getElementById('ctrl-volume-slider'),
  ctrlCurrentTime: document.getElementById('ctrl-current-time'),
  ctrlDuration: document.getElementById('ctrl-duration'),
  ctrlSpeedBtn: document.getElementById('ctrl-speed-btn'),
  speedLabel: document.getElementById('speed-label'),
  speedDropdown: document.getElementById('speed-dropdown'),
  ctrlPrevEp: document.getElementById('ctrl-prev-ep'),
  ctrlNextEp: document.getElementById('ctrl-next-ep'),
  ctrlMiniPlayer: document.getElementById('ctrl-mini-player'),
  ctrlFullscreen: document.getElementById('ctrl-fullscreen'),
  iconFsEnter: document.querySelector('.icon-fs-enter'),
  iconFsExit: document.querySelector('.icon-fs-exit'),

  // Player Nav Bar (Immediately below video)
  btnPlayerPrevEp: document.getElementById('btn-player-prev-ep'),
  btnPlayerNextEp: document.getElementById('btn-player-next-ep'),
  navEpTitle: document.getElementById('nav-ep-title'),

  // Iframe Player
  iframeContainer: document.getElementById('iframe-player-container'),
  embedIframe: document.getElementById('embed-iframe'),
  iframeDirectLink: document.getElementById('iframe-direct-link'),

  // Bottom Panels
  providerTabs: document.getElementById('provider-tabs'),
  quickEpisodesGrid: document.getElementById('quick-episodes-grid'),
  quickEpCount: document.getElementById('quick-ep-count'),

  // Shortcuts Modal
  shortcutsModal: document.getElementById('shortcuts-modal'),
  btnCloseShortcuts: document.getElementById('btn-close-shortcuts')
};

// ==========================================
// EPISODE NUMBER BADGE HELPER
// ==========================================
function getEpisodeNumberBadge(ep, index) {
  const name = (ep && ep.name) ? ep.name : '';
  const m1 = name.match(/(\d+)\s*\.\s*Bölüm/i);
  if (m1) return `${m1[1]}. Bölüm`;

  const m2 = name.match(/Bölüm\s*(\d+)/i);
  if (m2) return `${m2[1]}. Bölüm`;

  const m3 = name.match(/(?:Episode|Ep\.?|#)\s*(\d+)/i);
  if (m3) return `${m3[1]}. Bölüm`;

  const m4 = name.match(/\b(\d+)\b/);
  if (m4) return `${m4[1]}. Bölüm`;

  return `${index + 1}. Bölüm`;
}

function cleanHtmlText(str) {
  if (!str) return '';
  // Convert <br>, <br/>, <p> to newline
  let text = str.replace(/<br\s*[\/]?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value.trim();
}

// ==========================================
// STORAGE HELPERS
// ==========================================
function loadStorage() {
  try {
    const favs = JSON.parse(localStorage.getItem(STORAGE_FAVS) || '[]');
    State.favorites = new Set(favs);
    State.favoriteEpisodes = JSON.parse(localStorage.getItem(STORAGE_FAV_EPISODES) || '{}');
    State.episodeTimes = JSON.parse(localStorage.getItem(STORAGE_EPISODE_TIMES) || '{}');

    const rawHistory = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
    // Keep only the most recent episode per anime
    const seenAnimes = new Set();
    State.history = [];
    for (const h of rawHistory) {
      if (h && h.animeSlug && !seenAnimes.has(h.animeSlug)) {
        seenAnimes.add(h.animeSlug);
        State.history.push(h);
      }
      if (h && h.animeSlug && h.episodeSlug && typeof h.currentTime === 'number') {
        const key = `${h.animeSlug}_${h.episodeSlug}`;
        if (typeof State.episodeTimes[key] !== 'number') {
          State.episodeTimes[key] = h.currentTime;
        }
      }
    }
  } catch (e) {
    State.favorites = new Set();
    State.favoriteEpisodes = {};
    State.history = [];
    State.episodeTimes = {};
  }
  updateBadges();
}

function saveFavorites() {
  localStorage.setItem(STORAGE_FAVS, JSON.stringify(Array.from(State.favorites)));
  localStorage.setItem(STORAGE_FAV_EPISODES, JSON.stringify(State.favoriteEpisodes));
  updateBadges();
  renderFavoritesShelf();
}

function saveHistory(entry) {
  if (!entry || !entry.animeSlug) return;
  // Remove any previous entry for this anime so each anime appears ONLY ONCE with its latest episode
  State.history = State.history.filter(h => h.animeSlug !== entry.animeSlug);
  State.history.unshift(entry);
  if (State.history.length > 30) State.history.pop();
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(State.history));

  // Save episode specific timestamp in episodeTimes
  if (entry.episodeSlug) {
    State.episodeTimes[`${entry.animeSlug}_${entry.episodeSlug}`] = entry.currentTime;
    try {
      localStorage.setItem(STORAGE_EPISODE_TIMES, JSON.stringify(State.episodeTimes));
    } catch (e) { }
  }

  updateBadges();
  renderHistoryShelf();
}

function removeFromHistory(animeSlug, episodeSlug) {
  State.history = State.history.filter(h => h.animeSlug !== animeSlug);
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(State.history));
  updateBadges();
  renderHistoryShelf();
}

function getSavedEpisodeTime(animeSlug, episodeSlug) {
  const key = `${animeSlug}_${episodeSlug}`;
  if (State.episodeTimes && typeof State.episodeTimes[key] === 'number') {
    return State.episodeTimes[key];
  }
  const item = State.history.find(h => h.animeSlug === animeSlug && h.episodeSlug === episodeSlug);
  return item ? item.currentTime : 0;
}

function updateBadges() {
  const totalFavs = State.favorites.size + Object.keys(State.favoriteEpisodes).length;
  DOM.favBadge.textContent = totalFavs;
  DOM.favBadge.style.display = totalFavs > 0 ? 'inline-block' : 'none';

  if (DOM.favAnimeCount) DOM.favAnimeCount.textContent = State.favorites.size;
  if (DOM.favEpCount) DOM.favEpCount.textContent = Object.keys(State.favoriteEpisodes).length;

  DOM.historyBadge.textContent = State.history.length;
  DOM.historyBadge.style.display = State.history.length > 0 ? 'inline-block' : 'none';
}

function toggleFavorite(slug) {
  if (State.favorites.has(slug)) {
    State.favorites.delete(slug);
  } else {
    State.favorites.add(slug);
  }
  saveFavorites();
  updateDetailFavBtn();
  // Update card buttons on grid
  document.querySelectorAll(`.card-fav-btn[data-slug="${slug}"]`).forEach(btn => {
    const active = State.favorites.has(slug);
    btn.classList.toggle('active', active);
    btn.querySelector('svg')?.setAttribute('fill', active ? 'currentColor' : 'none');
  });
}

function toggleFavoriteEpisode(anime, ep, epIndex) {
  if (!anime || !ep) return;
  const key = `${anime.slug}_${ep.slug}`;
  if (State.favoriteEpisodes[key]) {
    delete State.favoriteEpisodes[key];
  } else {
    State.favoriteEpisodes[key] = {
      animeSlug: anime.slug,
      animeTitle: anime.title,
      poster: anime.poster,
      episodeSlug: ep.slug,
      episodeName: ep.name,
      episodeIndex: epIndex,
      numberBadge: getEpisodeNumberBadge(ep, epIndex),
      addedAt: Date.now()
    };
  }
  saveFavorites();
  updatePlayerFavBtnState();

  // Update chip heart states in UI
  document.querySelectorAll(`.ep-fav-btn-${CSS.escape(key)}`).forEach(b => {
    const isFav = !!State.favoriteEpisodes[key];
    b.classList.toggle('active', isFav);
    b.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
  });
}

function updatePlayerFavBtnState() {
  if (!DOM.btnPlayerFavEp || !State.currentAnime || !State.currentEpisodes[State.activeEpisodeIndex]) return;
  const ep = State.currentEpisodes[State.activeEpisodeIndex];
  const key = `${State.currentAnime.slug}_${ep.slug}`;
  const isFav = !!State.favoriteEpisodes[key];
  DOM.btnPlayerFavEp.classList.toggle('active', isFav);
  DOM.btnPlayerFavEp.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
}

// ==========================================
// API HELPERS
// ==========================================
async function fetchAnimes() {
  DOM.resultsCount.textContent = 'Aranıyor...';
  DOM.animeGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-dim);">
      <div class="spinner-ring" style="margin: 0 auto 1rem;"></div>
      Animeler yükleniyor...
    </div>
  `;

  const resolved = resolveAnimeSearchQuery(State.query);
  const params = new URLSearchParams({
    page: State.page,
    limit: State.limit,
    genre: State.genre,
    sort: State.sort,
    q: resolved.query
  });

  try {
    const res = await fetch(`/api/animes?${params}`);
    const data = await res.json();
    State.total = data.total;
    renderAnimeGrid(data.items, resolved);
    renderPagination();
  } catch (err) {
    DOM.animeGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">Animeler yüklenirken hata oluştu: ${err.message}</div>`;
  }
}

async function fetchGenres() {
  try {
    const res = await fetch('/api/genres');
    const genres = await res.json();

    // Clear and ensure "Tümü" is the default first pill
    DOM.genresContainer.innerHTML = '<button class="genre-pill active" data-genre="">Tümü</button>';

    genres.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'genre-pill';
      btn.dataset.genre = g;
      btn.textContent = g;
      DOM.genresContainer.appendChild(btn);
    });
  } catch (err) {
    console.error('Genres load error:', err);
  }
}

async function openAnimeDetail(slug) {
  try {
    const res = await fetch(`/api/anime/${slug}`);
    const anime = await res.json();
    State.currentAnime = anime;

    // Populate modal
    DOM.detailPoster.src = anime.poster || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22420%22 fill=%22%23161c28%22><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2222%22 text-anchor=%22middle%22>Poster</text></svg>';
    DOM.detailTitle.textContent = anime.title;
    DOM.detailJpTitle.textContent = anime.japanese_title || '';
    DOM.detailCategory.textContent = anime.category || 'TV';
    const scoreVal = anime.score || '8.0';
    DOM.detailScore.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      ${scoreVal}
    `;
    DOM.detailEpCount.textContent = `${anime.episodes_count} Bölüm`;
    DOM.detailStudio.textContent = anime.studio ? `Stüdyo: ${anime.studio}` : '';
    DOM.detailDates.textContent = anime.start_date || '';
    DOM.detailSummary.textContent = cleanHtmlText(anime.summary) || 'Açıklama bulunmuyor.';

    // Genres
    DOM.detailGenres.innerHTML = (anime.genres || []).map(g => `<span class="genre-tag">${g}</span>`).join('');

    // Favorite button state
    updateDetailFavBtn();

    // Fetch episodes
    DOM.episodesGrid.innerHTML = '<div style="grid-column: 1/-1; color: var(--text-dim);">Bölümler yükleniyor...</div>';
    DOM.detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const epRes = await fetch(`/api/anime/${slug}/episodes`);
    const epData = await epRes.json();
    State.currentEpisodes = (epData.episodes || []).map(ep => {
      if (ep.links) ep.links = sortLinksByReliability(ep.links);
      return ep;
    });
    DOM.episodesBadge.textContent = State.currentEpisodes.length;
    renderEpisodesList(State.currentEpisodes);

    // Fetch related seasons/movies/OVAs
    fetchRelatedAnime(slug);
  } catch (err) {
    alert('Anime detayları yüklenemedi: ' + err.message);
  }
}

function updateDetailFavBtn() {
  if (!State.currentAnime) return;
  const isFav = State.favorites.has(State.currentAnime.slug);
  DOM.detailFavBtn.classList.toggle('active', isFav);
  DOM.detailFavBtn.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
}

// ==========================================
// RENDERERS
// ==========================================
function renderAnimeGrid(items, resolved = {}) {
  if (!items || items.length === 0) {
    DOM.resultsCount.textContent = 'Sonuç bulunamadı';
    DOM.animeGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-dim);">
        <div style="margin-bottom: 0.75rem; color: var(--primary); display: flex; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        Aradığınız kriterlere uygun anime bulunamadı.
      </div>
    `;
    return;
  }

  if (resolved.aliasFound && State.query) {
    DOM.resultsCount.textContent = `"${State.query}" [${resolved.targetRomaji}] için ${State.total.toLocaleString('tr-TR')} Anime bulundu (Sayfa ${State.page})`;
  } else if (State.query) {
    DOM.resultsCount.textContent = `"${State.query}" için ${State.total.toLocaleString('tr-TR')} Anime bulundu (Sayfa ${State.page})`;
  } else {
    DOM.resultsCount.textContent = `${State.total.toLocaleString('tr-TR')} Anime listelendi (Sayfa ${State.page})`;
  }
  DOM.animeGrid.innerHTML = '';

  items.forEach(anime => {
    const isFav = State.favorites.has(anime.slug);
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
      <div class="card-poster-wrap">
        <img class="card-poster" src="${anime.poster}" alt="${anime.title}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22420%22 viewBox=%220 0 300 420%22><rect width=%22300%22 height=%22420%22 fill=%22%23161c28%22/><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2222%22 font-family=%22sans-serif%22 font-weight=%22bold%22 text-anchor=%22middle%22 dy=%22.3em%22>ANİME</text></svg>'">
        ${anime.score ? `<span class="card-badge-score"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>${anime.score}</span>` : ''}
        <span class="card-badge-episodes">${anime.episodes_count} Bölüm</span>
        <button class="card-fav-btn ${isFav ? 'active' : ''}" title="Favorilere Ekle" data-slug="${anime.slug}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${anime.title}">${anime.title}</h3>
        <span class="card-genres">${anime.genres.join(', ') || anime.category}</span>
      </div>
    `;

    // Card click opens detail
    card.onclick = (e) => {
      if (e.target.closest('.card-fav-btn')) return;
      openAnimeDetail(anime.slug);
    };

    // Favorite click
    const favBtn = card.querySelector('.card-fav-btn');
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(anime.slug);
    };

    DOM.animeGrid.appendChild(card);
  });
}

function renderPagination() {
  const maxPage = Math.ceil(State.total / State.limit) || 1;
  DOM.pageInfo.textContent = `Sayfa ${State.page} / ${maxPage}`;
  DOM.btnPrevPage.disabled = State.page <= 1;
  DOM.btnNextPage.disabled = State.page >= maxPage;
  DOM.btnFirstPage.disabled = State.page <= 1;
  DOM.btnLastPage.disabled = State.page >= maxPage;
  DOM.pageJumpInput.max = maxPage;
  DOM.pageJumpInput.placeholder = `${State.page}`;
}

// Render episode list inside Anime Detail Modal with Batch Tabs for large series
const EPISODE_BATCH_SIZE = 50;

function renderEpisodeChips(listToRender, allEpisodes) {
  DOM.episodesGrid.innerHTML = '';
  listToRender.forEach((ep) => {
    const chip = document.createElement('div');
    const realIndex = allEpisodes.indexOf(ep);
    const savedTime = getSavedEpisodeTime(State.currentAnime.slug, ep.slug);
    const isWatched = savedTime > 0;
    const epBadge = getEpisodeNumberBadge(ep, realIndex);
    const favKey = `${State.currentAnime.slug}_${ep.slug}`;
    const isEpFav = !!State.favoriteEpisodes[favKey];

    chip.className = `episode-chip ${isWatched ? 'watched' : ''}`;
    chip.innerHTML = `
      <div class="episode-chip-left">
        <span class="ep-number-badge">${epBadge}</span>
        <div class="episode-chip-info">
          <span class="episode-chip-title" title="${ep.name}">${ep.name}</span>
          <span class="episode-chip-status">${ep.links.length} Kaynak ${isWatched ? '• İzlendi' : ''}</span>
        </div>
      </div>
      <button class="ep-chip-fav-btn ep-fav-btn-${CSS.escape(favKey)} ${isEpFav ? 'active' : ''}" title="${isEpFav ? 'Bölümü Favorilerden Çıkar' : 'Bölümü Favorilere Ekle'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isEpFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </button>
    `;

    chip.onclick = (e) => {
      if (e.target.closest('.ep-chip-fav-btn')) return;
      startEpisode(realIndex);
    };

    const favBtn = chip.querySelector('.ep-chip-fav-btn');
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavoriteEpisode(State.currentAnime, ep, realIndex);
    };

    DOM.episodesGrid.appendChild(chip);
  });
}

function renderEpisodesList(episodes) {
  const query = DOM.episodeFilterInput.value.trim().toLowerCase();

  // If user is searching in the episode search bar: search across ALL episodes
  if (query) {
    if (DOM.episodesBatchTabs) DOM.episodesBatchTabs.style.display = 'none';
    const filtered = episodes.filter(ep => {
      return ep.name.toLowerCase().includes(query) || ep.slug.includes(query);
    });

    if (filtered.length === 0) {
      DOM.episodesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-dim);">Aramanıza uygun bölüm bulunamadı.</div>';
      return;
    }
    renderEpisodeChips(filtered, episodes);
    return;
  }

  // If large episode count (> 40), split into clean batch tabs
  if (episodes.length > 40) {
    const totalBatches = Math.ceil(episodes.length / EPISODE_BATCH_SIZE);
    if (State.activeBatchIndex >= totalBatches) State.activeBatchIndex = 0;

    if (DOM.episodesBatchTabs) {
      DOM.episodesBatchTabs.style.display = 'flex';
      DOM.episodesBatchTabs.innerHTML = '';

      for (let i = 0; i < totalBatches; i++) {
        const start = i * EPISODE_BATCH_SIZE + 1;
        const end = Math.min((i + 1) * EPISODE_BATCH_SIZE, episodes.length);
        const btn = document.createElement('button');
        btn.className = `ep-tab-btn ${i === State.activeBatchIndex ? 'active' : ''}`;
        btn.innerHTML = `Bölüm ${start} - ${end} <span class="ep-tab-badge">${end - start + 1}</span>`;
        btn.onclick = () => {
          State.activeBatchIndex = i;
          renderEpisodesList(episodes);
        };
        DOM.episodesBatchTabs.appendChild(btn);
      }
    }

    const startIdx = State.activeBatchIndex * EPISODE_BATCH_SIZE;
    const batchList = episodes.slice(startIdx, startIdx + EPISODE_BATCH_SIZE);
    renderEpisodeChips(batchList, episodes);
  } else {
    if (DOM.episodesBatchTabs) DOM.episodesBatchTabs.style.display = 'none';
    renderEpisodeChips(episodes, episodes);
  }
}

// Render "Kaldığın Yerden Devam Et" (at the very top!)
function renderHistoryShelf() {
  if (!State.history || State.history.length === 0) {
    DOM.sectionHistory.style.display = 'none';
    return;
  }

  // Deduplicate: only show latest watched episode per anime
  const seenAnimes = new Set();
  const uniqueHistory = [];
  for (const item of State.history) {
    if (item && item.animeSlug && !seenAnimes.has(item.animeSlug)) {
      seenAnimes.add(item.animeSlug);
      uniqueHistory.push(item);
    }
  }

  if (uniqueHistory.length === 0) {
    DOM.sectionHistory.style.display = 'none';
    return;
  }

  DOM.sectionHistory.style.display = 'block';
  DOM.historyGrid.innerHTML = '';

  uniqueHistory.slice(0, 8).forEach(item => {
    const percent = Math.min(100, Math.round((item.currentTime / (item.duration || 1400)) * 100));
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <button class="history-remove-btn" title="Geçmişten Kaldır">&times;</button>
      <img src="${item.poster || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22140%22 fill=%22%23161c28%22><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2218%22 text-anchor=%22middle%22>Afis</text></svg>'}" class="history-poster" alt="${item.animeTitle}">
      <div class="history-info">
        <div>
          <h4 class="history-anime-title">${item.animeTitle}</h4>
          <span class="history-ep-title">${item.episodeName}</span>
        </div>
        <div>
          <span class="history-time">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${formatTime(item.currentTime)} / ${formatTime(item.duration)} (%${percent})
          </span>
          <div class="history-progress-wrap">
            <div class="history-progress-bar" style="width: ${percent}%;"></div>
          </div>
        </div>
      </div>
    `;

    // Click anywhere on card resumes
    card.onclick = (e) => {
      if (e.target.closest('.history-remove-btn')) return;
      resumeFromHistory(item);
    };

    // Remove single item from history
    const removeBtn = card.querySelector('.history-remove-btn');
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeFromHistory(item.animeSlug, item.episodeSlug);
    };

    DOM.historyGrid.appendChild(card);
  });
}

// Render "Favorilerim" Shelf (Dual Tabs: Animeler & Bölümler)
// ==========================================
// FAVORITES MODAL (Dedicated Screen)
// ==========================================
function openFavoritesModal() {
  renderFavoritesModalContent();
  DOM.favoritesModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFavoritesModal() {
  DOM.favoritesModal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderFavoritesShelf() {
  updateBadges();
  // If favorites modal is open, update its content live
  if (DOM.favoritesModal && DOM.favoritesModal.style.display === 'flex') {
    renderFavoritesModalContent();
  }
}

function renderFavoritesModalContent() {
  const isAnimes = (State.favTab !== 'episodes');
  State.favTab = isAnimes ? 'animes' : 'episodes';

  // Toggle active tab header buttons
  DOM.tabFavAnimes.classList.toggle('active', isAnimes);
  DOM.tabFavEpisodes.classList.toggle('active', !isAnimes);

  if (isAnimes) {
    DOM.favoritesAnimesGrid.classList.remove('hidden');
    DOM.favoritesAnimesGrid.style.display = 'grid';
    DOM.favoritesEpisodesGrid.classList.add('hidden');
    DOM.favoritesEpisodesGrid.style.display = 'none';
    renderFavoritesAnimesGrid();
  } else {
    DOM.favoritesAnimesGrid.classList.add('hidden');
    DOM.favoritesAnimesGrid.style.display = 'none';
    DOM.favoritesEpisodesGrid.classList.remove('hidden');
    DOM.favoritesEpisodesGrid.style.display = 'grid';
    renderFavoritesEpisodesGrid();
  }
}

function renderFavoritesAnimesGrid() {
  const slugs = Array.from(State.favorites);
  if (slugs.length === 0) {
    DOM.favoritesAnimesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; color: var(--text-dim); font-size: 0.95rem;">
        Henüz favori animeniz bulunmuyor.<br>Anime kartlarındaki veya detay sayfasındaki kalp simgesine tıklayarak ekleyebilirsiniz.
      </div>
    `;
    return;
  }

  DOM.favoritesAnimesGrid.innerHTML = '<div style="grid-column: 1/-1; color: var(--text-dim); padding: 1.5rem; text-align: center;">Favoriler yükleniyor...</div>';

  Promise.all(slugs.map(slug => fetch(`/api/anime/${slug}`).then(r => r.json()).catch(() => null)))
    .then(favAnimes => {
      DOM.favoritesAnimesGrid.innerHTML = '';
      favAnimes.filter(Boolean).forEach(anime => {
        const card = document.createElement('div');
        card.className = 'fav-mini-card';
        card.innerHTML = `
          <img class="fav-mini-thumb" src="${anime.poster}" alt="${anime.title}" referrerpolicy="no-referrer">
          <div class="fav-mini-info">
            <div class="fav-mini-title" title="${anime.title}">${anime.title}</div>
            <div class="fav-mini-sub">${anime.episodes_count} Bölüm • ${anime.category || 'TV'}</div>
          </div>
          <button class="fav-mini-action" title="Favorilerden Kaldır">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        `;

        card.onclick = (e) => {
          if (e.target.closest('.fav-mini-action')) return;
          closeFavoritesModal();
          openAnimeDetail(anime.slug);
        };

        const removeBtn = card.querySelector('.fav-mini-action');
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          toggleFavorite(anime.slug);
        };

        DOM.favoritesAnimesGrid.appendChild(card);
      });
    });
}

function renderFavoritesEpisodesGrid() {
  const episodes = Object.values(State.favoriteEpisodes);
  if (episodes.length === 0) {
    DOM.favoritesEpisodesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; color: var(--text-dim); font-size: 0.95rem;">
        Henüz favori bölümünüz bulunmuyor.<br>Bölüm listesindeki kalp simgesine tıklayarak bölümleri favoriye ekleyebilirsiniz!
      </div>
    `;
    return;
  }

  DOM.favoritesEpisodesGrid.innerHTML = '';
  episodes.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).forEach(item => {
    const card = document.createElement('div');
    card.className = 'fav-mini-card';
    card.innerHTML = `
      <img src="${item.poster || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2242%22 height=%2258%22 fill=%22%23161c28%22><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2210%22 text-anchor=%22middle%22>Afis</text></svg>'}" class="fav-mini-thumb" alt="${item.animeTitle}">
      <div class="fav-mini-info">
        <div class="fav-mini-title" title="${item.animeTitle}">${item.animeTitle}</div>
        <div class="fav-mini-sub">${item.numberBadge || ''} ${item.episodeName}</div>
      </div>
      <button class="fav-mini-action" title="Favorilerden Kaldır">&times;</button>
    `;

    card.onclick = async (e) => {
      if (e.target.closest('.fav-mini-action')) return;
      closeFavoritesModal();
      await openAnimeDetail(item.animeSlug);
      const epIndex = State.currentEpisodes.findIndex(ep => ep.slug === item.episodeSlug);
      startEpisode(epIndex !== -1 ? epIndex : (item.episodeIndex || 0));
    };

    card.querySelector('.fav-mini-action').onclick = (e) => {
      e.stopPropagation();
      const key = `${item.animeSlug}_${item.episodeSlug}`;
      delete State.favoriteEpisodes[key];
      saveFavorites();
    };

    DOM.favoritesEpisodesGrid.appendChild(card);
  });
}

async function resumeFromHistory(item) {
  await openAnimeDetail(item.animeSlug);
  const epIndex = State.currentEpisodes.findIndex(ep => ep.slug === item.episodeSlug);
  if (epIndex !== -1) {
    startEpisode(epIndex);
  }
}

// ==========================================
// VIDEO SOURCE RELIABILITY & SORTING
// ==========================================
function sortLinksByReliability(links) {
  if (!links || links.length <= 1) return links || [];

  function getScore(link) {
    const p = (link.player || '').toUpperCase();
    const u = (link.url || '').trim().toLowerCase();

    // Defunct internal relative links (/player/...) have lowest priority
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      return -10000;
    }

    let score = 10000;
    if (link.can_stream || p.includes('SIBNET') || u.includes('sibnet.ru')) {
      score += 1000; // Native player stream proxy, 0 ads, seek, speed, landscape lock
    } else if (p.includes('ODNOKLASSNIKI') || p.includes('OK.RU') || u.includes('ok.ru') || u.includes('odnoklassniki')) {
      score += 850;  // Super reliable Russian cloud embed, 1080p-360p
    } else if (p.includes('MAIL') || u.includes('mail.ru')) {
      score += 800;  // Official Mail.ru video embed
    } else if (p.includes('MP4UPLOAD') || u.includes('mp4upload')) {
      score += 750;  // Dedicated anime video host
    } else if (p.includes('SENDVID') || u.includes('sendvid')) {
      score += 700;  // Clean embed, stable
    } else if (p.includes('UQLOAD') || u.includes('uqload')) {
      score += 650;  // Fast streaming host
    } else if (p.includes('DAILYMOTION') || u.includes('dailymotion')) {
      score += 620;  // Official platform
    } else if (p === 'VK' || u.includes('vk.com')) {
      score += 600;  // VK video player
    } else if (p.includes('MEGA') || u.includes('mega.nz')) {
      score += 580;  // MEGA cloud
    } else if (p.includes('VOE') || u.includes('voe.sx')) {
      score += 540;
    } else if (p.includes('FILEMOON') || u.includes('filemoon')) {
      score += 520;
    } else if (['STREAMSB', 'SBSTREAM', 'STREAMWISH', 'VIDHIDE'].some(k => p.includes(k))) {
      score += 480;
    } else if (p.includes('DOOD') || u.includes('dood')) {
      score += 460;
    } else if (['VUDEA', 'CLONE', 'TUBELOAD', 'EMBEDO', 'MVIDOO', 'VIDEA', 'YADISK', 'YOUTUBE', 'YOURUPLOAD'].some(k => p.includes(k))) {
      score += 400;
    } else if (p.includes('GDRIVE') || u.includes('google')) {
      score += 150;  // Often rate-limited by Google quota
    } else {
      score += 250;
    }
    return score;
  }

  // Filter out defunct / relative links if valid HTTP links exist
  const validHttp = links.filter(l => (l.url || '').startsWith('http://') || (l.url || '').startsWith('https://'));
  const candidateList = validHttp.length > 0 ? validHttp : links;

  return [...candidateList].sort((a, b) => getScore(b) - getScore(a));
}

// ==========================================
// SEARCH DROPDOWN & ALIAS ENGINE
// ==========================================
let searchDropdownTimeout = null;
let activeDropdownIndex = -1;

// Comprehensive English -> Romaji alias dictionary
const ANIME_ALIASES_MAP = {
  // Attack on Titan -> Always primary first season (shingeki no kyojin)
  "attack on titan": "shingeki no kyojin",
  "attack titan": "shingeki no kyojin",
  "aot": "shingeki no kyojin",
  "snk": "shingeki no kyojin",

  // Re:Zero
  "re:zero - starting life in another world": "re zero kara hajimeru isekai seikatsu",
  "re:zero starting life in another world": "re zero kara hajimeru isekai seikatsu",
  "starting life in another world": "re zero kara hajimeru isekai seikatsu",
  "re zero": "re:zero",
  "re:zero": "re:zero",
  "rezero": "re:zero",

  // Demon Slayer
  "demon slayer: kimetsu no yaiba": "kimetsu no yaiba",
  "demon slayer kimetsu no yaiba": "kimetsu no yaiba",
  "demon slayer": "kimetsu no yaiba",
  "kimetsu": "kimetsu no yaiba",

  // My Hero Academia
  "my hero academia": "boku no hero academia",
  "mha": "boku no hero academia",
  "bnha": "boku no hero academia",

  // Solo Leveling
  "solo leveling": "ore dake level up",
  "sololeveling": "ore dake level up",

  // Jujutsu Kaisen
  "jujutsu kaisen": "jujutsu kaisen",
  "jjk": "jujutsu kaisen",

  // Chainsaw Man
  "chainsaw man": "chainsaw man",
  "csm": "chainsaw man",

  // Hunter x Hunter
  "hunter x hunter": "hunter x hunter",
  "hxh": "hunter x hunter",

  // Bleach -> Primary first season
  "bleach: thousand-year blood war": "bleach",
  "bleach thousand year blood war": "bleach",
  "bleach tybw": "bleach",
  "thousand year blood war": "bleach",
  "tybw": "bleach",
  "bleach": "bleach",

  // Slime
  "that time i got reincarnated as a slime": "tensei shitara slime",
  "reincarnated as a slime": "tensei shitara slime",
  "tensura": "tensei shitara slime",
  "slime": "tensei shitara slime",

  // Mushoku Tensei
  "jobless reincarnation": "mushoku tensei",
  "mushoku tensei": "mushoku tensei",

  // Eminence in Shadow
  "the eminence in shadow": "kage no jitsuryokusha",
  "eminence in shadow": "kage no jitsuryokusha",
  "kagejitsu": "kage no jitsuryokusha",

  // Seven Deadly Sins
  "the seven deadly sins": "nanatsu no taizai",
  "seven deadly sins": "nanatsu no taizai",
  "7 deadly sins": "nanatsu no taizai",

  // Frieren
  "frieren: beyond journey's end": "sousou no frieren",
  "frieren beyond journey's end": "sousou no frieren",
  "frieren beyond journeys end": "sousou no frieren",
  "frieren": "sousou no frieren",

  // Delicious in Dungeon
  "delicious in dungeon": "dungeon meshi",
  "dungeon meshi": "dungeon meshi",

  // Shield Hero
  "the rising of the shield hero": "tate no yuusha",
  "rising of the shield hero": "tate no yuusha",
  "shield hero": "tate no yuusha",

  // DanMachi
  "is it wrong to try to pick up girls in a dungeon": "dungeon ni deai",
  "danmachi": "dungeon ni deai",

  // KonoSuba
  "god's blessing on this wonderful world": "kono subarashii sekai",
  "gods blessing on this wonderful world": "kono subarashii sekai",
  "konosuba": "kono subarashii sekai",

  // Fullmetal Alchemist
  "fullmetal alchemist: brotherhood": "fullmetal alchemist brotherhood",
  "fullmetal alchemist brotherhood": "fullmetal alchemist brotherhood",
  "fullmetal alchemist": "fullmetal alchemist",
  "fmab": "fullmetal alchemist brotherhood",
  "fma": "fullmetal alchemist",

  // Sword Art Online
  "sword art online": "sword art online",
  "sao": "sword art online",

  // One Punch Man
  "one punch man": "one punch man",
  "one-punch man": "one punch man",
  "opm": "one punch man",

  // Classroom of the Elite
  "classroom of the elite": "youkoso jitsuryoku",
  "cote": "youkoso jitsuryoku",

  // Dr. Stone
  "dr. stone": "dr stone",
  "dr stone": "dr stone",
  "drstone": "dr stone",

  // Hell's Paradise
  "hell's paradise": "jigokuraku",
  "hells paradise": "jigokuraku",
  "jigokuraku": "jigokuraku",

  // Kaiju No. 8
  "kaiju no. 8": "kaijuu 8-gou",
  "kaiju no 8": "kaijuu 8-gou",
  "kaiju 8": "kaijuu 8-gou",

  // Oshi no Ko
  "my star": "oshi no ko",
  "oshi no ko": "oshi no ko",

  // Your Name & A Silent Voice
  "your name": "kimi no na wa",
  "your name.": "kimi no na wa",
  "a silent voice": "koe no katachi",
  "the shape of voice": "koe no katachi",
  "i want to eat your pancreas": "kimi no suizou wo tabetai",
  "weathering with you": "tenki no ko",
  "suzume": "suzume no tojimari",
  "suzume no tojimari": "suzume no tojimari",
  "5 centimeters per second": "byousoku 5 centimeter",

  // Kaguya-sama
  "kaguya-sama: love is war": "kaguya-sama",
  "kaguya sama: love is war": "kaguya-sama",
  "kaguya-sama love is war": "kaguya-sama",
  "kaguya sama love is war": "kaguya-sama",
  "love is war": "kaguya-sama",
  "kaguya-sama": "kaguya-sama",
  "kaguya sama": "kaguya-sama",

  // Bunny Girl Senpai
  "rascal does not dream of bunny girl senpai": "seishun buta yarou",
  "bunny girl senpai": "seishun buta yarou",
  "aobuta": "seishun buta yarou",

  // The Angel Next Door
  "the angel next door spoils me rotten": "otonari no tenshi",
  "the angel next door": "otonari no tenshi",
  "angel next door": "otonari no tenshi",

  // My Dress-Up Darling
  "my dress-up darling": "sono bisque doll",
  "my dress up darling": "sono bisque doll",
  "sono bisque doll": "sono bisque doll",

  // The Quintessential Quintuplets
  "the quintessential quintuplets": "5-toubun no hanayome",
  "quintessential quintuplets": "5-toubun no hanayome",
  "5-toubun": "5-toubun no hanayome",

  // Rent-a-Girlfriend
  "rent-a-girlfriend": "kanojo okarishimasu",
  "rent a girlfriend": "kanojo okarishimasu",
  "kanokari": "kanojo okarishimasu",

  // Spy x Family
  "spy x family": "spy x family",
  "spy family": "spy x family",

  // Blue Lock & Sports
  "blue lock": "blue lock",
  "kuroko's basketball": "kuroko no basuke",
  "kuroko no basket": "kuroko no basuke",
  "haikyuu": "haikyuu",
  "haikyu": "haikyuu",
  "slam dunk": "slam dunk",
  "ao ashi": "ao ashi",
  "hajime no ippo": "hajime no ippo",

  // Tokyo Ghoul & Steins;Gate -> Primary first season
  "tokyo ghoul:re": "tokyo ghoul",
  "tokyo ghoul re": "tokyo ghoul",
  "tokyo ghoul": "tokyo ghoul",
  "steins;gate": "steins gate",
  "steins gate": "steins gate",

  // Death Note & Code Geass
  "death note": "death note",
  "code geass": "code geass",
  "cowboy bebop": "cowboy bebop",
  "neon genesis evangelion": "shin seiki evangelion",
  "evangelion": "evangelion",

  // Parasyte & Erased
  "parasyte: the maxim": "kiseijuu",
  "parasyte the maxim": "kiseijuu",
  "parasyte": "kiseijuu",
  "erased": "boku dake ga inai machi",
  "your lie in april": "shigatsu wa kimi no uso",
  "anohana": "ano hi mita hana",
  "the flower we saw that day": "ano hi mita hana",
  "clannad": "clannad",
  "angel beats": "angel beats",
  "violet evergarden": "violet evergarden",

  // Fire Force & Black Clover
  "fire force": "enen no shouboutai",
  "black clover": "black clover",
  "vinland saga": "vinland saga",
  "tokyo revengers": "tokyo revengers",
  "assassination classroom": "ansatsu kyoushitsu",
  "the promised neverland": "yakusoku no neverland",
  "tpn": "yakusoku no neverland",
  "made in abyss": "made in abyss",
  "cyberpunk: edgerunners": "cyberpunk edgerunners",
  "cyberpunk edgerunners": "cyberpunk edgerunners",
  "edgerunners": "cyberpunk edgerunners",

  // Fate series
  "fate/stay night": "fate stay night",
  "fate stay night": "fate stay night",
  "fate/zero": "fate zero",
  "fate zero": "fate zero",
  "fate grand order": "fate grand order",

  // Ghibli
  "spirited away": "sen to chihiro",
  "princess mononoke": "mononoke hime",
  "howl's moving castle": "howl no ugoku shiro",
  "howls moving castle": "howl no ugoku shiro",
  "my neighbor totoro": "tonari no totoro",
  "kiki's delivery service": "majo no takkyuubin",
  "grave of the fireflies": "hotaru no haka",

  // Miscellaneous Popular
  "bocchi the rock": "bocchi the rock",
  "bocchi": "bocchi the rock",
  "k-on": "k-on",
  "kon": "k-on",
  "laid-back camp": "yuru camp",
  "laid back camp": "yuru camp",
  "komi can't communicate": "komi-san wa komyushou",
  "komi cant communicate": "komi-san wa komyushou",
  "my happy marriage": "watashi no shiawase na kekkon",
  "the dangers in my heart": "boku no kokoro no yabai yatsu",
  "dandadan": "dandadan",
  "wind breaker": "wind breaker"
};

// Sort by key length descending so longer phrases like "attack on titan" match before "titan"
const SEARCH_ALIASES_SORTED = Object.entries(ANIME_ALIASES_MAP).sort((a, b) => b[0].length - a[0].length);

function resolveAnimeSearchQuery(rawQuery) {
  if (!rawQuery) return { original: '', query: '', aliasFound: false, matchedEnglish: '', targetRomaji: '' };
  const original = rawQuery.trim();
  let q = original.toLowerCase();

  // Normalize Turkish characters
  const charmap = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
  for (const [k, v] of Object.entries(charmap)) {
    q = q.replaceAll(k, v);
  }

  // 1. Direct query contains full alias (e.g. "attack on titan season 2" -> "shingeki no kyojin season 2")
  for (const [eng, romaji] of SEARCH_ALIASES_SORTED) {
    if (eng.includes(' ') || eng.length >= 5) {
      if (q.includes(eng)) {
        return {
          original,
          query: q.replace(eng, romaji),
          aliasFound: true,
          matchedEnglish: eng,
          targetRomaji: romaji
        };
      }
    } else {
      const regex = new RegExp(`\\b${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(q)) {
        return {
          original,
          query: q.replace(regex, romaji),
          aliasFound: true,
          matchedEnglish: eng,
          targetRomaji: romaji
        };
      }
    }
  }

  // 2. User typed a prefix or partial of an alias (e.g. "att", "attack", "demon", "slayer", "solo", "leveling")
  if (q.length >= 3) {
    // 2a. Any alias starts with q (e.g. "attack on titan".startsWith("attack") or .startsWith("att"))
    for (const [eng, romaji] of SEARCH_ALIASES_SORTED) {
      if (eng.startsWith(q)) {
        return {
          original,
          query: romaji,
          aliasFound: true,
          matchedEnglish: eng,
          targetRomaji: romaji
        };
      }
    }

    // 2b. Any word in an alias starts with or equals q (e.g. "titan" -> "shingeki no kyojin", "slayer" -> "kimetsu no yaiba")
    for (const [eng, romaji] of SEARCH_ALIASES_SORTED) {
      const words = eng.split(/[\s:._\-\/!?,;'"()]+/).filter(Boolean);
      if (words.some(w => w.startsWith(q) || w === q)) {
        return {
          original,
          query: romaji,
          aliasFound: true,
          matchedEnglish: eng,
          targetRomaji: romaji
        };
      }
    }
  }

  return {
    original,
    query: q,
    aliasFound: false,
    matchedEnglish: '',
    targetRomaji: ''
  };
}

function highlightMatch(text, q) {
  if (!q || !text) return text || '';
  const rawTokens = q.split(/[\s:._\-\/!?,;'"()]+/).filter(t => t.length > 0);
  if (rawTokens.length === 0) return text;

  const pattern = rawTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  try {
    const regex = new RegExp(`(${pattern})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  } catch (e) {
    return text;
  }
}

function showSearchDropdown(query) {
  if (!query || query.length < 1) {
    hideSearchDropdown();
    return;
  }

  // Show loading indicator in dropdown immediately
  DOM.searchDropdownResults.innerHTML = `
    <div class="search-dropdown-empty">
      <div class="spinner-ring" style="width: 22px; height: 22px; margin: 0 auto 8px; border-width: 2px;"></div>
      "${query}" aranıyor...
    </div>
  `;
  if (DOM.searchDropdownFooter) DOM.searchDropdownFooter.style.display = 'none';
  DOM.searchDropdown.style.display = 'block';
  activeDropdownIndex = -1;

  clearTimeout(searchDropdownTimeout);
  searchDropdownTimeout = setTimeout(async () => {
    try {
      const resolved = resolveAnimeSearchQuery(query);
      const params = new URLSearchParams({ q: resolved.query, limit: 8, page: 1 });
      const res = await fetch(`/api/animes?${params}`);
      const data = await res.json();
      renderSearchDropdown(data.items, query, resolved);
    } catch (err) {
      console.error('Search dropdown error:', err);
    }
  }, 150);
}

function renderSearchDropdown(items, query, resolved = {}) {
  activeDropdownIndex = -1;
  if (!items || items.length === 0) {
    const displayQ = resolved.aliasFound ? `${query} (${resolved.targetRomaji})` : query;
    DOM.searchDropdownResults.innerHTML = `
      <div class="search-dropdown-empty" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span>"${displayQ}" ile eşleşen anime bulunamadı</span>
      </div>
    `;
    if (DOM.searchDropdownFooter) DOM.searchDropdownFooter.style.display = 'none';
    DOM.searchDropdown.style.display = 'block';
    return;
  }

  DOM.searchDropdownResults.innerHTML = items.map(anime => {
    const aliasBadge = (resolved.aliasFound && resolved.matchedEnglish)
      ? `<span class="search-alias-badge">${resolved.matchedEnglish.toUpperCase()}</span>`
      : '';

    return `
    <div class="search-dropdown-item" data-slug="${anime.slug}">
      <img src="${anime.poster}" alt="${anime.title}" referrerpolicy="no-referrer" 
           onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2242%22 height=%2258%22 fill=%22%23161c28%22><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2212%22 text-anchor=%22middle%22>Afis</text></svg>'">
      <div class="search-dropdown-item-info">
        <div class="search-dropdown-item-title">
          ${highlightMatch(anime.title, `${query} ${resolved.query || ''}`)}
          ${aliasBadge}
        </div>
        <div class="search-dropdown-item-meta">
          <span class="search-dropdown-item-badge">${anime.category || 'TV'}</span>
          <span>${anime.episodes_count} Bölüm</span>
          <span>${(anime.genres || []).slice(0, 2).join(', ')}</span>
        </div>
      </div>
    </div>
  `;
  }).join('');

  // Dropdown footer to allow viewing full catalog results
  if (DOM.searchDropdownFooter) {
    DOM.searchDropdownFooter.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <strong>"${query}"</strong> için tüm sonuçları katalogda göster
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
    `;
    DOM.searchDropdownFooter.style.display = 'flex';
    DOM.searchDropdownFooter.onclick = () => {
      hideSearchDropdown();
      State.query = query;
      State.page = 1;
      fetchAnimes();
      window.scrollTo({ top: DOM.sectionCatalog.offsetTop - 80, behavior: 'smooth' });
    };
  }

  // Click handlers
  DOM.searchDropdownResults.querySelectorAll('.search-dropdown-item').forEach(item => {
    item.onclick = () => {
      const slug = item.dataset.slug;
      hideSearchDropdown();
      openAnimeDetail(slug);
    };
  });

  DOM.searchDropdown.style.display = 'block';
}

function navigateDropdown(direction) {
  const items = DOM.searchDropdownResults.querySelectorAll('.search-dropdown-item');
  if (!items || items.length === 0) return;

  items.forEach(i => i.classList.remove('focused'));
  activeDropdownIndex += direction;
  if (activeDropdownIndex < 0) activeDropdownIndex = items.length - 1;
  if (activeDropdownIndex >= items.length) activeDropdownIndex = 0;

  const target = items[activeDropdownIndex];
  target.classList.add('focused');
  target.scrollIntoView({ block: 'nearest' });
}

function hideSearchDropdown() {
  DOM.searchDropdown.style.display = 'none';
  if (DOM.searchDropdownFooter) DOM.searchDropdownFooter.style.display = 'none';
  clearTimeout(searchDropdownTimeout);
  activeDropdownIndex = -1;
}

// ==========================================
// RELATED ANIME & SEASONS
// ==========================================
async function fetchRelatedAnime(slug) {
  try {
    const res = await fetch(`/api/anime/${slug}/related`);
    const data = await res.json();
    renderRelatedSeasons(data.related || [], slug);
  } catch (err) {
    console.warn('Related anime fetch error:', err);
    DOM.relatedSeasonsSection.style.display = 'none';
  }
}

function renderRelatedSeasons(related, currentSlug) {
  if (!related || related.length <= 1) {
    DOM.relatedSeasonsSection.style.display = 'none';
    return;
  }

  // Preserve scroll position so cards don't jump/shift when switching seasons
  const prevScroll = DOM.relatedSeasonsGrid ? DOM.relatedSeasonsGrid.scrollLeft : 0;

  // Visual Card Shelf (in anime modal)
  DOM.relatedSeasonsSection.style.display = 'block';
  DOM.relatedSeasonsGrid.innerHTML = '';

  related.forEach(item => {
    const isCurrent = item.slug === currentSlug;
    const typeClass = (item.type || 'TV').toLowerCase();
    const card = document.createElement('div');
    card.className = `related-season-card ${isCurrent ? 'current' : ''}`;
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" referrerpolicy="no-referrer"
           onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22130%22 height=%22170%22 fill=%22%23161c28%22><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2214%22 text-anchor=%22middle%22>Poster</text></svg>'">
      <div class="related-season-card-body">
        <span class="related-season-type-badge ${typeClass}">${item.type}</span>
        <div class="related-season-card-title">${item.title}</div>
        <div class="related-season-card-meta">${item.episodes_count} Bölüm</div>
      </div>
    `;

    if (!isCurrent) {
      card.onclick = () => {
        openAnimeDetail(item.slug);
      };
    }

    DOM.relatedSeasonsGrid.appendChild(card);
  });

  if (DOM.relatedSeasonsGrid) {
    DOM.relatedSeasonsGrid.scrollLeft = prevScroll;
  }
}

// ==========================================
// VIDEO PLAYER LOGIC & YOUTUBE GESTURES
// ==========================================
async function startEpisode(epIndex, linkIndex = 0) {
  if (!State.currentEpisodes[epIndex]) return;
  State.activeEpisodeIndex = epIndex;

  const ep = State.currentEpisodes[epIndex];
  if (ep.links) {
    ep.links = sortLinksByReliability(ep.links);
  }

  State.activeLinkIndex = linkIndex;

  DOM.playerAnimeName.textContent = State.currentAnime.title;
  DOM.playerEpName.textContent = `${getEpisodeNumberBadge(ep, epIndex)} - ${ep.name}`;
  DOM.playerModal.classList.remove('mini-player-mode');
  DOM.playerModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  updatePlayerFavBtnState();
  renderProviderTabs(ep.links);
  renderQuickEpisodesGrid();

  if (!ep.links || ep.links.length === 0) {
    alert('Bu bölüm için aktif video kaynağı bulunamadı.');
    return;
  }

  loadLink(ep.links[linkIndex] || ep.links[0]);
}

function renderProviderTabs(links) {
  DOM.providerTabs.innerHTML = '';
  if (!links || links.length === 0) return;

  links.forEach((link, idx) => {
    const tab = document.createElement('button');
    tab.className = `provider-tab ${idx === State.activeLinkIndex ? 'active' : ''}`;

    let badgeHtml = '';
    if (link.can_stream) {
      badgeHtml = '<span class="provider-native-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>YEREL OYNATICI</span>';
    } else if (idx === 0) {
      badgeHtml = '<span class="provider-native-badge best-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>ÖNERİLEN</span>';
    }

    tab.innerHTML = `
      <span class="provider-player-name">${link.player}</span>
      <span class="provider-fansub-name" style="font-size: 0.75rem; opacity: 0.7;">(${link.fansub})</span>
      ${badgeHtml}
    `;

    tab.onclick = () => {
      State.activeLinkIndex = idx;
      document.querySelectorAll('.provider-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
      loadLink(link);
    };

    DOM.providerTabs.appendChild(tab);
  });
}

// 3-Column Episodes Grid Immediately Under Video Player
function renderQuickEpisodesGrid() {
  const totalEps = State.currentEpisodes.length;
  DOM.quickEpCount.textContent = `${totalEps} Bölüm`;

  const currentEp = State.currentEpisodes[State.activeEpisodeIndex];
  if (currentEp) {
    DOM.navEpTitle.textContent = `${getEpisodeNumberBadge(currentEp, State.activeEpisodeIndex)} - ${currentEp.name}`;
  }

  // Enable / Disable prev and next buttons
  DOM.btnPlayerPrevEp.disabled = State.activeEpisodeIndex <= 0;
  DOM.btnPlayerNextEp.disabled = State.activeEpisodeIndex >= totalEps - 1;

  DOM.quickEpisodesGrid.innerHTML = '';
  State.currentEpisodes.forEach((ep, idx) => {
    const isCurrent = idx === State.activeEpisodeIndex;
    const savedTime = getSavedEpisodeTime(State.currentAnime.slug, ep.slug);
    const isWatched = savedTime > 0;
    const epBadge = getEpisodeNumberBadge(ep, idx);
    const favKey = `${State.currentAnime.slug}_${ep.slug}`;
    const isEpFav = !!State.favoriteEpisodes[favKey];

    const chip = document.createElement('button');
    chip.className = `quick-ep-chip ${isCurrent ? 'active' : ''} ${isWatched ? 'watched' : ''}`;
    chip.innerHTML = `
      <div class="quick-ep-chip-left">
        <span class="ep-number-badge">${epBadge}</span>
        <span class="quick-ep-chip-title" title="${ep.name}">${ep.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <span class="quick-ep-icon">
          ${isCurrent
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Oynatılıyor'
        : (isWatched
          ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> İzlendi'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>')
      }
        </span>
        <span class="ep-chip-fav-btn ep-fav-btn-${CSS.escape(favKey)} ${isEpFav ? 'active' : ''}" title="Favorilere Ekle/Çıkar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${isEpFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </span>
      </div>
    `;

    chip.onclick = (e) => {
      if (e.target.closest('.ep-chip-fav-btn')) return;
      startEpisode(idx, 0);
    };

    const favBtn = chip.querySelector('.ep-chip-fav-btn');
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavoriteEpisode(State.currentAnime, ep, idx);
    };

    DOM.quickEpisodesGrid.appendChild(chip);
  });

  // Scroll active episode into view
  const activeChip = DOM.quickEpisodesGrid.children[State.activeEpisodeIndex];
  if (activeChip) {
    activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function loadLink(link) {
  resetPlayerUI();
  if (DOM.btnExternalLink) DOM.btnExternalLink.href = link.url;
  if (DOM.iframeDirectLink) DOM.iframeDirectLink.href = link.url;

  // Resolve stream with backend
  DOM.bufferingSpinner.style.display = 'flex';
  try {
    const res = await fetch(`/api/resolve?url=${encodeURIComponent(link.url)}`);
    const data = await res.json();

    if (data.success && data.type === 'mp4' && data.stream_url) {
      // Native HTML5 Player Mode (Sibnet direct stream)
      enableNativePlayer(data.stream_url);
    } else {
      // Fallback Iframe Player Mode
      enableIframePlayer(link.url);
    }
  } catch (err) {
    console.warn('Resolve error, falling back to iframe:', err);
    enableIframePlayer(link.url);
  }
}

function enableNativePlayer(streamUrl) {
  State.playerMode = 'native';
  DOM.nativeContainer.style.display = 'block';
  DOM.iframeContainer.style.display = 'none';

  const video = DOM.nativeVideo;
  video.src = streamUrl;
  video.playbackRate = State.userSpeed;
  DOM.speedLabel.textContent = `${State.userSpeed}x`;

  // Check saved progress
  const savedTime = getSavedEpisodeTime(State.currentAnime.slug, State.currentEpisodes[State.activeEpisodeIndex].slug);

  video.onloadedmetadata = () => {
    DOM.ctrlDuration.textContent = formatTime(video.duration);
    if (savedTime > 15 && savedTime < (video.duration - 30)) {
      video.currentTime = savedTime;
      showResumeBubble(savedTime);
    }
    video.play().catch(() => { });
  };

  video.onerror = () => {
    console.warn('Native video error, falling back to embed iframe...');
    const currentEp = State.currentEpisodes[State.activeEpisodeIndex];
    if (currentEp && currentEp.links && currentEp.links[State.activeLinkIndex]) {
      enableIframePlayer(currentEp.links[State.activeLinkIndex].url);
    }
  };
}

function enableIframePlayer(embedUrl) {
  State.playerMode = 'iframe';
  DOM.nativeContainer.style.display = 'none';
  DOM.iframeContainer.style.display = 'block';
  DOM.embedIframe.src = embedUrl;
  DOM.bufferingSpinner.style.display = 'none';
}

function resetPlayerUI() {
  if (State.clearStallWatchdog) State.clearStallWatchdog();
  DOM.nativeVideo.pause();
  DOM.nativeVideo.src = '';
  DOM.embedIframe.src = '';
  DOM.progressPlayed.style.width = '0%';
  DOM.progressBuffered.style.width = '0%';
  DOM.ctrlCurrentTime.textContent = '00:00';
  DOM.ctrlDuration.textContent = '00:00';
  DOM.resumeBubble.style.display = 'none';
  if (DOM.btnCenterPlay) {
    DOM.btnCenterPlay.classList.remove('hidden');
    if (DOM.centerIconPlay) DOM.centerIconPlay.style.display = 'block';
    if (DOM.centerIconPause) DOM.centerIconPause.style.display = 'none';
  }
}

function showResumeBubble(seconds) {
  DOM.resumeText.textContent = `${formatTime(seconds)} noktasından devam ediliyor...`;
  DOM.resumeBubble.style.display = 'flex';
  setTimeout(() => {
    DOM.resumeBubble.style.display = 'none';
  }, 4000);
}

// ==========================================
// YOUTUBE GESTURES: TOUCH CONTROLS & 2X HOLD
// ==========================================
function setupGestures() {
  let lastTapTime = 0;
  let tapTimer = null;
  let holdTriggered = false;

  // Toggle Controls Visibility on Tap / Touch (Hide if open, Open if hidden)
  function toggleControlsVisibility() {
    const isVisible = !DOM.playerControlsBar.classList.contains('hidden');
    clearTimeout(State.controlsTimeout);

    if (isVisible) {
      // If already open, hide immediately (if playing)
      if (!DOM.nativeVideo.paused) {
        DOM.playerControlsBar.classList.add('hidden');
        if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.add('hidden');
      }
    } else {
      // If hidden, show and schedule auto-hide after 3.5s
      DOM.playerControlsBar.classList.remove('hidden');
      if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.remove('hidden');
      if (!DOM.nativeVideo.paused) {
        State.controlsTimeout = setTimeout(() => {
          DOM.playerControlsBar.classList.add('hidden');
          if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.add('hidden');
        }, 3500);
      }
    }
  }

  // Double tap / Single tap handler
  function handleScreenTap(e, side) {
    const now = Date.now();
    const diff = now - lastTapTime;

    if (diff < 320 && diff > 0) {
      // Double Tap detected!
      clearTimeout(tapTimer);
      lastTapTime = 0;
      if (side === 'left') {
        skipSeconds(-5);
        triggerRipple(DOM.rippleLeft);
      } else if (side === 'right') {
        skipSeconds(5);
        triggerRipple(DOM.rippleRight);
      } else {
        togglePlayPause();
        triggerPlayPulse();
      }
    } else {
      // Single Tap
      lastTapTime = now;
      tapTimer = setTimeout(() => {
        lastTapTime = 0;
        // On single tap, toggle controls visibility (close if open, open if closed)
        toggleControlsVisibility();
      }, 240);
    }
  }

  DOM.gestureLeft.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
  });

  DOM.gestureLeft.addEventListener('click', (e) => handleScreenTap(e, 'left'));
  DOM.gestureRight.addEventListener('click', (e) => handleScreenTap(e, 'right'));
  DOM.gestureCenter.addEventListener('click', (e) => handleScreenTap(e, 'center'));

  // Press & Hold to Double Current Speed (Mobile & Desktop)
  const startHold = () => {
    if (DOM.nativeVideo.paused) return;
    State.holdTimeout = setTimeout(() => {
      holdTriggered = true;
      State.isHolding2X = true;
      const baseSpeed = State.userSpeed || 1.0;
      const boostedSpeed = Math.min(16.0, baseSpeed * 2);
      DOM.nativeVideo.playbackRate = boostedSpeed;
      if (DOM.speedHoldBadgeText) {
        DOM.speedHoldBadgeText.textContent = `${boostedSpeed}X HIZ`;
      }
      DOM.speedHoldBadge.classList.add('active');
      if (navigator.vibrate) navigator.vibrate(35);
    }, 240);
  };

  const endHold = () => {
    clearTimeout(State.holdTimeout);
    if (holdTriggered) {
      holdTriggered = false;
      State.isHolding2X = false;
      DOM.nativeVideo.playbackRate = State.userSpeed || 1.0;
      DOM.speedHoldBadge.classList.remove('active');
    }
  };

  DOM.nativeContainer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.player-controls-bar') || e.target.closest('.top-tool-btn')) return;
    startHold();
  });

  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);

  // Show controls on mouse move inside player screen (Desktop only, ignore touch pointermove)
  DOM.playerScreenContainer.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      DOM.playerControlsBar.classList.remove('hidden');
      if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.remove('hidden');
      clearTimeout(State.controlsTimeout);
      if (!DOM.nativeVideo.paused) {
        State.controlsTimeout = setTimeout(() => {
          DOM.playerControlsBar.classList.add('hidden');
          if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.add('hidden');
        }, 3500);
      }
    }
  });
}

function triggerRipple(element) {
  element.classList.remove('active');
  void element.offsetWidth; // Trigger reflow
  element.classList.add('active');
  setTimeout(() => {
    element.classList.remove('active');
  }, 450);
}

function triggerPlayPulse() {
  DOM.playPulse.classList.remove('active');
  void DOM.playPulse.offsetWidth;
  DOM.playPulse.classList.add('active');
  setTimeout(() => {
    DOM.playPulse.classList.remove('active');
  }, 350);
}

function skipSeconds(seconds) {
  if (State.playerMode !== 'native') return;
  DOM.nativeVideo.currentTime = Math.max(0, Math.min(DOM.nativeVideo.duration, DOM.nativeVideo.currentTime + seconds));
}

function togglePlayPause() {
  if (State.playerMode !== 'native') return;
  if (DOM.nativeVideo.paused) {
    DOM.nativeVideo.play();
  } else {
    DOM.nativeVideo.pause();
  }
}

// ==========================================
// CONTROLS & TIME SYNC (TOUCH & DESKTOP)
// ==========================================
function setupControls() {
  const video = DOM.nativeVideo;

  video.addEventListener('play', () => {
    DOM.iconPlay.style.display = 'none';
    DOM.iconPause.style.display = 'block';
    if (DOM.centerIconPlay) DOM.centerIconPlay.style.display = 'none';
    if (DOM.centerIconPause) DOM.centerIconPause.style.display = 'block';
    scheduleHideControls();
  });

  video.addEventListener('pause', () => {
    DOM.iconPlay.style.display = 'block';
    DOM.iconPause.style.display = 'none';
    if (DOM.centerIconPlay) DOM.centerIconPlay.style.display = 'block';
    if (DOM.centerIconPause) DOM.centerIconPause.style.display = 'none';
    DOM.playerControlsBar.classList.remove('hidden');
    if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.remove('hidden');
    clearTimeout(State.controlsTimeout);
  });

  // ==========================================
  // AUTO-RECOVERY WATCHDOG (Donma Önleme & Kurtarma)
  // ==========================================
  let stallWatchdogTimer = null;
  let stallRetryCount = 0;
  let lastWatchedCurrentTime = 0;

  function clearStallWatchdog() {
    if (stallWatchdogTimer) {
      clearTimeout(stallWatchdogTimer);
      stallWatchdogTimer = null;
    }
    stallRetryCount = 0;
  }
  State.clearStallWatchdog = clearStallWatchdog;

  function triggerStallRecovery() {
    if (video.paused || video.ended || !video.src) return;
    if (stallWatchdogTimer) return;

    // Normal tamponlamaya 2.5 saniye mühlet tanı
    stallWatchdogTimer = setTimeout(() => {
      stallWatchdogTimer = null;
      if (video.paused || video.ended || !video.src) return;

      // Video hâlâ veri alamıyorsa veya oynatma ilerlemiyorsa
      if (video.readyState < 3 || Math.abs(video.currentTime - lastWatchedCurrentTime) < 0.1) {
        stallRetryCount++;
        const curTime = video.currentTime;
        console.warn(`[Auto-Recovery] Donma algılandı (deneme ${stallRetryCount}). Konum: ${curTime.toFixed(1)}s. Bağlantı tazeleniyor...`);

        if (stallRetryCount <= 2) {
          // Mikro ileri alma (+0.15s): Tarayıcının bayatlayan TCP soketini kapatıp
          // sunucuya taze bir HTTP Range isteği atmasını zorlar!
          const maxTarget = (video.duration && video.duration > 1) ? (video.duration - 0.5) : (curTime + 2);
          video.currentTime = Math.min(maxTarget, curTime + 0.15);
          video.play().catch(() => { });
          triggerStallRecovery();
        } else {
          // Derin kurtarma: Bağlantıyı sıfırdan aynı saniyeden yeniden aç
          const currentSrc = video.src;
          video.src = currentSrc;
          video.currentTime = curTime;
          video.play().catch(() => { });
          clearStallWatchdog();
        }
      }
    }, 2500);
  }

  video.addEventListener('waiting', () => {
    DOM.bufferingSpinner.style.display = 'flex';
    triggerStallRecovery();
  });

  video.addEventListener('stalled', () => {
    triggerStallRecovery();
  });

  video.addEventListener('canplay', () => {
    DOM.bufferingSpinner.style.display = 'none';
  });

  video.addEventListener('playing', () => {
    DOM.bufferingSpinner.style.display = 'none';
    clearStallWatchdog();
  });

  video.addEventListener('seeking', () => {
    clearStallWatchdog();
  });

  // Arka planda donmayı izleyen nabız (heartbeat) kontrolü
  setInterval(() => {
    if (State.playerMode === 'native' && !video.paused && !video.ended && !State.isScrubbing && video.src) {
      if (video.currentTime > 0 && Math.abs(video.currentTime - lastWatchedCurrentTime) < 0.05 && video.readyState < 3) {
        triggerStallRecovery();
      }
      lastWatchedCurrentTime = video.currentTime;
    }
  }, 3500);

  video.addEventListener('timeupdate', () => {
    if (State.isScrubbing) return;
    const current = video.currentTime;
    const duration = video.duration || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    DOM.progressPlayed.style.width = `${percent}%`;
    DOM.progressScrubber.style.left = `${percent}%`;
    DOM.ctrlCurrentTime.textContent = formatTime(current);

    // Save history periodically
    if (Math.floor(current) % 3 === 0 && duration > 0 && State.currentAnime) {
      saveHistory({
        animeSlug: State.currentAnime.slug,
        animeTitle: State.currentAnime.title,
        poster: State.currentAnime.poster,
        episodeSlug: State.currentEpisodes[State.activeEpisodeIndex].slug,
        episodeName: State.currentEpisodes[State.activeEpisodeIndex].name,
        currentTime: Math.round(current),
        duration: Math.round(duration),
        timestamp: Date.now()
      });
    }
  });

  video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const percent = (bufferedEnd / video.duration) * 100;
      DOM.progressBuffered.style.width = `${percent}%`;
    }
  });

  video.addEventListener('ended', () => {
    // Auto-play next episode
    if (State.activeEpisodeIndex < State.currentEpisodes.length - 1) {
      startEpisode(State.activeEpisodeIndex + 1, 0);
    }
  });

  function scheduleHideControls() {
    clearTimeout(State.controlsTimeout);
    State.controlsTimeout = setTimeout(() => {
      if (!DOM.nativeVideo.paused) {
        DOM.playerControlsBar.classList.add('hidden');
        if (DOM.btnCenterPlay) DOM.btnCenterPlay.classList.add('hidden');
      }
    }, 3500);
  }

  // Play / Pause Buttons (Bottom Bar and Screen Center)
  DOM.ctrlPlayPause.onclick = togglePlayPause;
  if (DOM.btnCenterPlay) {
    DOM.btnCenterPlay.onclick = (e) => {
      e.stopPropagation();
      togglePlayPause();
      DOM.btnCenterPlay.classList.add('active-pulse');
      setTimeout(() => DOM.btnCenterPlay.classList.remove('active-pulse'), 200);
    };
  }
  DOM.ctrlRewind.onclick = () => skipSeconds(-10);
  DOM.ctrlForward.onclick = () => skipSeconds(10);

  // Volume
  const savedVol = localStorage.getItem(STORAGE_VOLUME);
  if (savedVol !== null) {
    video.volume = parseFloat(savedVol);
    DOM.ctrlVolumeSlider.value = savedVol;
  }

  DOM.ctrlVolumeSlider.oninput = (e) => {
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    video.muted = vol === 0;
    localStorage.setItem(STORAGE_VOLUME, vol);
    updateVolumeIcon();
  };

  DOM.ctrlMute.onclick = () => {
    video.muted = !video.muted;
    DOM.ctrlVolumeSlider.value = video.muted ? 0 : video.volume;
    updateVolumeIcon();
  };

  function updateVolumeIcon() {
    const isMuted = video.muted || video.volume === 0;
    DOM.iconVolHigh.style.display = isMuted ? 'none' : 'block';
    DOM.iconVolMute.style.display = isMuted ? 'block' : 'none';
  }

  // Progress Bar Scrubbing: Mouse & Touch Event Support
  const seekMouse = (e) => {
    const rect = DOM.progressContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * (video.duration || 0);
  };

  const seekTouch = (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = DOM.progressContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    video.currentTime = pos * (video.duration || 0);
  };

  // Mouse scrubbing
  DOM.progressContainer.addEventListener('mousedown', (e) => {
    State.isScrubbing = true;
    seekMouse(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (State.isScrubbing) seekMouse(e);

    // Hover time preview
    const rect = DOM.progressContainer.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top - 25 && e.clientY <= rect.bottom + 15) {
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      DOM.progressHoverTime.style.left = `${pos * 100}%`;
      DOM.progressHoverTime.textContent = formatTime(pos * (video.duration || 0));
    }
  });

  window.addEventListener('mouseup', () => {
    State.isScrubbing = false;
  });

  // Touch scrubbing on mobile phones
  DOM.progressContainer.addEventListener('touchstart', (e) => {
    State.isScrubbing = true;
    seekTouch(e);
  }, { passive: false });

  DOM.progressContainer.addEventListener('touchmove', (e) => {
    if (State.isScrubbing) {
      seekTouch(e);
    }
  }, { passive: false });

  DOM.progressContainer.addEventListener('touchend', () => {
    State.isScrubbing = false;
  });

  // Speed Selector
  DOM.ctrlSpeedBtn.onclick = (e) => {
    e.stopPropagation();
    DOM.speedDropdown.style.display = DOM.speedDropdown.style.display === 'none' ? 'flex' : 'none';
  };

  document.querySelectorAll('.speed-opt').forEach(opt => {
    opt.onclick = () => {
      const sp = parseFloat(opt.dataset.speed);
      State.userSpeed = sp;
      video.playbackRate = sp;
      DOM.speedLabel.textContent = `${sp}x`;
      document.querySelectorAll('.speed-opt').forEach(o => o.classList.toggle('active', o === opt));
      DOM.speedDropdown.style.display = 'none';
    };
  });

  window.addEventListener('click', () => {
    DOM.speedDropdown.style.display = 'none';
  });

  // Next / Prev Episodes (Controls Bar)
  DOM.ctrlPrevEp.onclick = () => {
    if (State.activeEpisodeIndex > 0) {
      startEpisode(State.activeEpisodeIndex - 1, 0);
    }
  };

  DOM.ctrlNextEp.onclick = () => {
    if (State.activeEpisodeIndex < State.currentEpisodes.length - 1) {
      startEpisode(State.activeEpisodeIndex + 1, 0);
    }
  };

  // Next / Prev Episodes (Bar Immediately Below Video)
  DOM.btnPlayerPrevEp.onclick = () => {
    if (State.activeEpisodeIndex > 0) {
      startEpisode(State.activeEpisodeIndex - 1, 0);
    }
  };

  DOM.btnPlayerNextEp.onclick = () => {
    if (State.activeEpisodeIndex < State.currentEpisodes.length - 1) {
      startEpisode(State.activeEpisodeIndex + 1, 0);
    }
  };

  // Top Bar Episode Favorite Button
  DOM.btnPlayerFavEp.onclick = () => {
    if (!State.currentAnime || !State.currentEpisodes[State.activeEpisodeIndex]) return;
    const ep = State.currentEpisodes[State.activeEpisodeIndex];
    toggleFavoriteEpisode(State.currentAnime, ep, State.activeEpisodeIndex);
  };

  // Fullscreen
  DOM.ctrlFullscreen.onclick = toggleFullscreen;

  const handleFullscreenChange = () => {
    const isFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    DOM.iconFsEnter.style.display = isFs ? 'none' : 'block';
    DOM.iconFsExit.style.display = isFs ? 'block' : 'none';
    if (!isFs) {
      unlockScreenOrientation();
    } else {
      lockScreenLandscape();
    }
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  // iOS Safari native fullscreen on video
  if (DOM.nativeVideo) {
    DOM.nativeVideo.addEventListener('webkitbeginfullscreen', () => {
      DOM.iconFsEnter.style.display = 'none';
      DOM.iconFsExit.style.display = 'block';
      lockScreenLandscape();
    });
    DOM.nativeVideo.addEventListener('webkitendfullscreen', () => {
      DOM.iconFsEnter.style.display = 'block';
      DOM.iconFsExit.style.display = 'none';
      unlockScreenOrientation();
    });
  }

  // Theater Mode
  DOM.btnTheaterMode.onclick = () => {
    DOM.playerWrapper.classList.toggle('theater-mode');
  };
}

// Orientation Helpers for Mobile Fullscreen
async function lockScreenLandscape() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    } else if (screen.lockOrientation) {
      screen.lockOrientation('landscape');
    } else if (screen.mozLockOrientation) {
      screen.mozLockOrientation('landscape');
    } else if (screen.msLockOrientation) {
      screen.msLockOrientation('landscape');
    }
  } catch (err) {
    // Orientation lock might fail on desktop or unsupported devices - silent handling
    console.log('Orientation lock note:', err);
  }
}

function unlockScreenOrientation() {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      screen.msUnlockOrientation();
    }
  } catch (err) {
    console.log('Orientation unlock note:', err);
  }
}

async function toggleFullscreen() {
  const container = DOM.playerScreenContainer;
  const isFs = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  if (!isFs) {
    let reqPromise = null;
    try {
      if (container.requestFullscreen) {
        reqPromise = container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        reqPromise = container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        reqPromise = container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        reqPromise = container.msRequestFullscreen();
      } else if (DOM.nativeVideo && DOM.nativeVideo.webkitEnterFullscreen) {
        DOM.nativeVideo.webkitEnterFullscreen();
        return;
      }

      if (reqPromise && typeof reqPromise.then === 'function') {
        await reqPromise;
      }

      // Auto rotate/lock to landscape on mobile after entering fullscreen
      await lockScreenLandscape();
    } catch (err) {
      console.warn('Fullscreen request error:', err);
      // Fallback for iOS video
      if (DOM.nativeVideo && DOM.nativeVideo.webkitEnterFullscreen) {
        try {
          DOM.nativeVideo.webkitEnterFullscreen();
        } catch (e) { }
      }
    }
  } else {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
    unlockScreenOrientation();
  }
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    // If typing in input, ignore hotkeys
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    // Esc closes modals
    if (e.key === 'Escape') {
      if (DOM.favoritesModal && DOM.favoritesModal.style.display !== 'none') {
        closeFavoritesModal();
      } else if (DOM.shortcutsModal.style.display !== 'none') {
        DOM.shortcutsModal.style.display = 'none';
      } else if (DOM.playerModal.style.display !== 'none') {
        closePlayer();
      } else if (DOM.detailModal.style.display !== 'none') {
        closeDetail();
      }
      return;
    }

    // Global hotkey '/' to focus search & show navbar
    if (e.key === '/' && DOM.globalSearch && DOM.playerModal.style.display === 'none') {
      e.preventDefault();
      DOM.navbar.classList.remove('navbar--hidden');
      DOM.globalSearch.focus();
      return;
    }

    // Hotkeys inside player
    if (DOM.playerModal.style.display !== 'none' && State.playerMode === 'native') {
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          triggerPlayPulse();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipSeconds(-5);
          triggerRipple(DOM.rippleLeft);
          break;
        case 'arrowright':
          e.preventDefault();
          skipSeconds(5);
          triggerRipple(DOM.rippleRight);
          break;
        case 'j':
          e.preventDefault();
          skipSeconds(-10);
          triggerRipple(DOM.rippleLeft);
          break;
        case 'l':
          e.preventDefault();
          skipSeconds(10);
          triggerRipple(DOM.rippleRight);
          break;
        case 'arrowup':
          e.preventDefault();
          DOM.nativeVideo.volume = Math.min(1, DOM.nativeVideo.volume + 0.05);
          DOM.ctrlVolumeSlider.value = DOM.nativeVideo.volume;
          break;
        case 'arrowdown':
          e.preventDefault();
          DOM.nativeVideo.volume = Math.max(0, DOM.nativeVideo.volume - 0.05);
          DOM.ctrlVolumeSlider.value = DOM.nativeVideo.volume;
          break;
        case 'm':
          DOM.ctrlMute.click();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          toggleMiniPlayer();
          break;
        case 't':
          DOM.btnTheaterMode.click();
          break;
        default:
          if (e.key >= '0' && e.key <= '9') {
            const pct = parseInt(e.key) / 10;
            DOM.nativeVideo.currentTime = pct * DOM.nativeVideo.duration;
          }
          break;
      }
    }
  });
}

// ==========================================
// HELPERS & NAVIGATION
// ==========================================
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function closeDetail() {
  DOM.detailModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  State.currentAnime = null;
}

function toggleMiniPlayer() {
  if (DOM.playerModal.style.display === 'none') return;

  const isMini = DOM.playerModal.classList.contains('mini-player-mode');
  if (isMini) {
    // Return to Full Player
    DOM.playerModal.classList.remove('mini-player-mode');
    document.body.style.overflow = 'hidden';
  } else {
    // Switch to Mini Player (bottom right of screen, allows browsing site)
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
    }
    unlockScreenOrientation();
    DOM.playerModal.classList.add('mini-player-mode');
    document.body.style.overflow = 'auto';
  }
}

function closePlayer() {
  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => { });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
  unlockScreenOrientation();
  DOM.playerModal.classList.remove('mini-player-mode');
  DOM.playerModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  DOM.nativeVideo.pause();
  DOM.nativeVideo.src = '';
  DOM.embedIframe.src = '';
  renderHistoryShelf();
}

// ==========================================
// GENRES CATEGORIES TOUCH SWIPING & SELECTION
// ==========================================
function setupGenresInteraction() {
  const container = DOM.genresContainer;
  if (!container) return;

  // Arrow buttons
  if (DOM.btnGenreLeft) {
    DOM.btnGenreLeft.onclick = () => {
      container.scrollBy({ left: -240, behavior: 'smooth' });
    };
  }
  if (DOM.btnGenreRight) {
    DOM.btnGenreRight.onclick = () => {
      container.scrollBy({ left: 240, behavior: 'smooth' });
    };
  }

  let isSwiping = false;
  let startX = 0;
  let hasMoved = false;

  // Touch swiping on mobile
  container.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches[0]) return;
    hasMoved = false;
    startX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const diff = Math.abs(e.touches[0].clientX - startX);
    if (diff > 8) {
      hasMoved = true;
      isSwiping = true;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    setTimeout(() => {
      isSwiping = false;
      hasMoved = false;
    }, 100);
  });

  // Mouse swiping for desktop
  let isMouseDown = false;
  let mouseStartX = 0;
  let mouseStartScroll = 0;

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isMouseDown = true;
    hasMoved = false;
    mouseStartX = e.clientX;
    mouseStartScroll = container.scrollLeft;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const diff = e.clientX - mouseStartX;
    if (Math.abs(diff) > 5) {
      hasMoved = true;
      isSwiping = true;
      container.scrollLeft = mouseStartScroll - diff;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      setTimeout(() => {
        isSwiping = false;
        hasMoved = false;
      }, 100);
    }
  });

  // Delegated click handler for category pills
  container.addEventListener('click', (e) => {
    const pill = e.target.closest('.genre-pill');
    if (!pill) return;

    // If user was swiping/dragging, don't trigger selection
    if (isSwiping || hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const selectedGenre = pill.dataset.genre || '';
    if (State.genre === selectedGenre && pill.classList.contains('active')) {
      return;
    }

    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    State.genre = selectedGenre;
    State.page = 1;
    fetchAnimes();

    // Center selected pill in the scroll container
    pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}

// ==========================================
// SMART NAVBAR (HIDE ON SCROLL DOWN, SHOW ON SCROLL UP)
// ==========================================
function setupNavbarScroll() {
  if (!DOM.navbar) return;

  let lastScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
  let isTicking = false;
  const SCROLL_THRESHOLD = 70; // Only hide after passing navbar height
  const DELTA_MIN = 8;         // Minimum movement to avoid micro-scroll jitter

  function updateNavbar() {
    const currentScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);

    // If near the top of the page, always show navbar
    if (currentScrollY <= SCROLL_THRESHOLD) {
      DOM.navbar.classList.remove('navbar--hidden');
      lastScrollY = currentScrollY;
      return;
    }

    const diff = currentScrollY - lastScrollY;

    // Ignore tiny scroll changes (prevents flickering/jitter)
    if (Math.abs(diff) < DELTA_MIN) {
      return;
    }

    // Ignore bounce at the bottom of the document
    const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (currentScrollY >= maxScroll - 20 && diff > 0) {
      lastScrollY = currentScrollY;
      return;
    }

    if (diff > 0) {
      // User is scrolling down -> hide navbar smoothly
      if (!DOM.navbar.classList.contains('navbar--hidden')) {
        DOM.navbar.classList.add('navbar--hidden');
        if (typeof hideSearchDropdown === 'function') {
          hideSearchDropdown();
        }
        if (DOM.globalSearch && document.activeElement === DOM.globalSearch) {
          DOM.globalSearch.blur();
        }
      }
    } else {
      // User is scrolling up -> show navbar smoothly
      if (DOM.navbar.classList.contains('navbar--hidden')) {
        DOM.navbar.classList.remove('navbar--hidden');
      }
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        updateNavbar();
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  // If search is focused, ensure navbar is visible
  if (DOM.globalSearch) {
    DOM.globalSearch.addEventListener('focus', () => {
      DOM.navbar.classList.remove('navbar--hidden');
    });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
  loadStorage();
  fetchGenres();
  fetchAnimes();
  renderHistoryShelf();
  renderFavoritesShelf();
  setupGenresInteraction();
  setupGestures();
  setupControls();
  setupKeyboard();
  setupNavbarScroll();

  // Search with dropdown (Instant autocomplete without filtering main catalog while typing!)
  DOM.globalSearch.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    DOM.clearSearch.style.display = val ? 'block' : 'none';
    showSearchDropdown(val);
  });

  DOM.globalSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const focusedItem = DOM.searchDropdownResults.querySelector('.search-dropdown-item.focused');
      if (focusedItem) {
        focusedItem.click();
        return;
      }
      const val = DOM.globalSearch.value.trim();
      hideSearchDropdown();
      State.query = val;
      State.page = 1;
      fetchAnimes();
      scrollToCatalog();
    } else if (e.key === 'ArrowDown') {
      navigateDropdown(1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      navigateDropdown(-1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      hideSearchDropdown();
    }
  });

  // Hide dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search-wrap')) {
      hideSearchDropdown();
    }
  });

  // Re-show dropdown on focus if there's text
  DOM.globalSearch.addEventListener('focus', () => {
    const val = DOM.globalSearch.value.trim();
    if (val.length >= 1) showSearchDropdown(val);
  });

  DOM.clearSearch.onclick = () => {
    DOM.globalSearch.value = '';
    DOM.clearSearch.style.display = 'none';
    hideSearchDropdown();
    State.query = '';
    State.page = 1;
    fetchAnimes();
  };

  // Sort
  DOM.sortSelect.onchange = (e) => {
    State.sort = e.target.value;
    State.page = 1;
    fetchAnimes();
  };

  // Pagination
  const scrollToCatalog = () => {
    const el = DOM.sectionCatalog;
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }
  };

  DOM.btnFirstPage.onclick = () => {
    if (State.page > 1) {
      State.page = 1;
      fetchAnimes();
      scrollToCatalog();
    }
  };

  DOM.btnPrevPage.onclick = () => {
    if (State.page > 1) {
      State.page--;
      fetchAnimes();
      scrollToCatalog();
    }
  };

  DOM.btnNextPage.onclick = () => {
    const maxPage = Math.ceil(State.total / State.limit) || 1;
    if (State.page < maxPage) {
      State.page++;
      fetchAnimes();
      scrollToCatalog();
    }
  };

  DOM.btnLastPage.onclick = () => {
    const maxPage = Math.ceil(State.total / State.limit) || 1;
    if (State.page < maxPage) {
      State.page = maxPage;
      fetchAnimes();
      scrollToCatalog();
    }
  };

  DOM.btnGoPage.onclick = () => {
    const maxPage = Math.ceil(State.total / State.limit) || 1;
    let target = parseInt(DOM.pageJumpInput.value, 10);
    if (!isNaN(target)) {
      if (target < 1) target = 1;
      if (target > maxPage) target = maxPage;
      State.page = target;
      fetchAnimes();
      scrollToCatalog();
      DOM.pageJumpInput.value = '';
    }
  };

  DOM.pageJumpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      DOM.btnGoPage.click();
    }
  });

  // Modal Closers
  DOM.btnCloseDetail.onclick = closeDetail;
  DOM.btnClosePlayer.onclick = closePlayer;
  if (DOM.btnMiniPlayer) DOM.btnMiniPlayer.onclick = toggleMiniPlayer;
  if (DOM.ctrlMiniPlayer) DOM.ctrlMiniPlayer.onclick = toggleMiniPlayer;
  DOM.detailFavBtn.onclick = () => {
    if (State.currentAnime) {
      toggleFavorite(State.currentAnime.slug);
    }
  };

  DOM.episodeFilterInput.addEventListener('input', () => {
    renderEpisodesList(State.currentEpisodes);
  });

  // Favorites Dual Tabs Switching
  DOM.tabFavAnimes.onclick = () => {
    State.favTab = 'animes';
    renderFavoritesModalContent();
  };

  DOM.tabFavEpisodes.onclick = () => {
    State.favTab = 'episodes';
    renderFavoritesModalContent();
  };

  // Nav buttons
  DOM.btnHome.onclick = () => {
    State.query = '';
    State.genre = '';
    State.page = 1;
    DOM.globalSearch.value = '';
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.genre-pill[data-genre=""]')?.classList.add('active');
    fetchAnimes();
    DOM.navbar.classList.remove('navbar--hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  DOM.navCatalog.onclick = () => {
    DOM.sectionCatalog.scrollIntoView({ behavior: 'smooth' });
  };

  DOM.navHistory.onclick = () => {
    if (DOM.sectionHistory.style.display !== 'none') {
      DOM.sectionHistory.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('Henüz izleme geçmişiniz bulunmuyor. Bir bölüm izlediğinizde burada görünecektir!');
    }
  };

  DOM.navFavorites.onclick = () => {
    openFavoritesModal();
  };

  DOM.btnCloseFavorites.onclick = closeFavoritesModal;

  DOM.favoritesModal.addEventListener('click', (e) => {
    if (e.target === DOM.favoritesModal) {
      closeFavoritesModal();
    }
  });

  DOM.btnClearHistory.onclick = () => {
    if (confirm('İzleme geçmişini temizlemek istediğinizden emin misiniz?')) {
      State.history = [];
      localStorage.removeItem(STORAGE_HISTORY);
      updateBadges();
      renderHistoryShelf();
    }
  };

  // Hotkeys Modal
  DOM.btnHotkeys.onclick = () => {
    DOM.shortcutsModal.style.display = 'flex';
  };
  DOM.btnCloseShortcuts.onclick = () => {
    DOM.shortcutsModal.style.display = 'none';
  };

  // Close modals clicking outside container
  DOM.detailModal.onclick = (e) => {
    if (e.target === DOM.detailModal) closeDetail();
  };
  DOM.shortcutsModal.onclick = (e) => {
    if (e.target === DOM.shortcutsModal) DOM.shortcutsModal.style.display = 'none';
  };
}

document.addEventListener('DOMContentLoaded', init);
