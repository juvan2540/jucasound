// ===== JucaSound - Player Premium =====

// ===== STATE =====
let tracks = [];
let currentTrack = null;
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0: off, 1: all, 2: one
let favorites = JSON.parse(localStorage.getItem('jucasound_favorites') || '[]');
let playlists = JSON.parse(localStorage.getItem('jucasound_playlists') || '[]');

const audio = document.getElementById('audio');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadMusicFromServer();
  setupEventListeners();
  setupVisualizer();
  renderPlaylists();
  createHeroBars();
});

// ===== LOAD MUSIC =====
// ===== CLOUD TRACKS (Discovery) =====
const cloudTracks = [
  { id: 'c1', title: 'Energia Positiva', artist: 'Google Audio', album: 'Discovery', url: 'http://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3', duration: 120 },
  { id: 'c2', title: 'Espaço Sideral', artist: 'NASA', album: 'Planetas', url: 'https://www.nasa.gov/wp-content/uploads/2023/11/apollo_11_launch.mp3', duration: 30 },
  { id: 'c3', title: 'Ritmo Eletrônico', artist: 'Demo Audio', album: 'Dance', url: 'http://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3', duration: 150 },
  { id: 'c4', title: 'Vibe Noturna', artist: 'Juca Cloud', album: 'Chill', url: 'http://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3', duration: 180 },
  { id: 'c5', title: 'Sinfonia Digital', artist: 'Tech Music', album: 'Future', url: 'http://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.mp3', duration: 45 }
];

async function loadMusicFromServer() {
  try {
    const res = await fetch('/api/tracks');
    const data = await res.json();
    let localTracks = data.tracks || [];
    
    // Gerar mais 90 músicas variadas para completar as 100
    const extraTracks = [];
    const baseUrls = [
        'http://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3',
        'http://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3',
        'http://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3',
        'http://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.mp3'
    ];
    for(let i=11; i<=100; i++) {
        extraTracks.push({
            id: 'c' + i,
            title: `Global Hit #${i}`,
            artist: ['Juca Beats', 'DJ Master', 'Cloud Artist', 'Vibe Maker'][i % 4],
            album: 'Cloud Discovery',
            url: baseUrls[i % baseUrls.length],
            duration: 180 + (i % 60)
        });
    }
    
    tracks = [...localTracks, ...cloudTracks, ...extraTracks];
    renderTracks();
    renderLibrary();
    renderFavorites();
  } catch (e) {
    console.log('Servidor offline, carregando do localStorage...');
    tracks = JSON.parse(localStorage.getItem('jucasound_tracks') || '[]');
    renderTracks();
  }
}

function addLocalFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('audio/')) continue;
    const url = URL.createObjectURL(file);
    const nameParts = file.name.replace(/\.\w+$/, '').split(' - ');
    const track = {
      id: Date.now() + Math.random(),
      title: nameParts.length > 1 ? nameParts.slice(1).join(' - ').trim() : nameParts[0].trim(),
      artist: nameParts.length > 1 ? nameParts[0].trim() : 'Artista Desconhecido',
      album: 'Minha Coleção',
      url: url,
      duration: 0,
      isLocal: true
    };
    tracks.push(track);
  }
  renderTracks();
  renderLibrary();
  showToast(`${files.length} música(s) adicionada(s)! 🎵`);
}

// ===== RENDER TRACKS =====
function renderTracks(list = tracks, containerId = 'trackList') {
  const container = document.getElementById(containerId);
  if (!container) return;

  document.getElementById('trackCount').textContent = `${tracks.length} faixas`;

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma música encontrada. Clique em "📂 Adicionar" para começar!</p>';
    return;
  }

  container.innerHTML = list.map((track, i) => `
    <div class="track-item ${currentIndex === i && containerId === 'trackList' ? 'playing' : ''}" 
         onclick="playTrack(${tracks.indexOf(track)})" data-index="${tracks.indexOf(track)}">
      <div class="track-number">
        <span class="track-number-text">${i + 1}</span>
        <div class="playing-indicator">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="track-artwork">
        ${getArtworkEmoji(track.artist)}
      </div>
      <div class="track-info">
        <span class="track-name">${track.title}</span>
        <span class="track-artist-name">${track.artist}</span>
      </div>
      <span class="track-album">${track.album || ''}</span>
      <span class="track-duration">${formatTime(track.duration || 0)}</span>
      <div class="track-actions">
        <button onclick="event.stopPropagation(); toggleFavorite('${track.id}')" title="Favoritar">
          ${favorites.includes(String(track.id)) ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  `).join('');
}

function getArtworkEmoji(artist) {
  const lower = (artist || '').toLowerCase();
  if (lower.includes('dj') || lower.includes('bobo')) return '🎧';
  if (lower.includes('whigfield')) return '💃';
  if (lower.includes('tiririca')) return '😂';
  if (lower.includes('planet') || lower.includes('soul')) return '🌍';
  if (lower.includes('brother')) return '🕺';
  const emojis = ['🎵', '🎸', '🎹', '🎤', '🎷', '🥁', '🎺', '🎶'];
  return emojis[Math.abs(hashCode(artist)) % emojis.length];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// ===== LIBRARY =====
function renderLibrary() {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  const artists = {};
  tracks.forEach(t => {
    if (!artists[t.artist]) artists[t.artist] = [];
    artists[t.artist].push(t);
  });

  grid.innerHTML = Object.entries(artists).map(([name, songs]) => `
    <div class="artist-card" onclick="filterByArtist('${name.replace(/'/g, "\\'")}')">
      <div class="artist-avatar">${getArtworkEmoji(name)}</div>
      <div class="artist-name">${name}</div>
      <div class="artist-tracks">${songs.length} música(s)</div>
    </div>
  `).join('');
}

function filterByArtist(artist) {
  const filtered = tracks.filter(t => t.artist === artist);
  document.querySelector('[data-view="home"]').click();
  setTimeout(() => {
    renderTracks(filtered);
    document.querySelector('.section-header h3').textContent = `🎤 ${artist}`;
  }, 100);
}

// ===== FAVORITES =====
function toggleFavorite(id) {
  id = String(id);
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
    showToast('Adicionada às favoritas! ❤️');
  } else {
    favorites.splice(idx, 1);
    showToast('Removida das favoritas');
  }
  localStorage.setItem('jucasound_favorites', JSON.stringify(favorites));
  renderTracks();
  renderFavorites();
  updateFavoriteButton();
}

function renderFavorites() {
  const container = document.getElementById('favoritesList');
  if (!container) return;
  const favTracks = tracks.filter(t => favorites.includes(String(t.id)));
  if (favTracks.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma música favorita ainda. Clique no ❤️ para adicionar!</p>';
    return;
  }
  renderTracks(favTracks, 'favoritesList');
}

function updateFavoriteButton() {
  const btn = document.getElementById('btnFavorite');
  if (currentTrack && favorites.includes(String(currentTrack.id))) {
    btn.textContent = '❤️';
    btn.classList.add('active');
  } else {
    btn.textContent = '🤍';
    btn.classList.remove('active');
  }
}

// ===== PLAYLISTS =====
function renderPlaylists() {
  const container = document.getElementById('playlistList');
  container.innerHTML = playlists.map((pl, i) => `
    <div class="playlist-item" onclick="loadPlaylist(${i})">🎵 ${pl.name}</div>
  `).join('');
}

function createPlaylist() {
  const name = prompt('Nome da nova playlist:');
  if (!name) return;
  playlists.push({ name, tracks: [] });
  localStorage.setItem('jucasound_playlists', JSON.stringify(playlists));
  renderPlaylists();
  showToast(`Playlist "${name}" criada! 🎶`);
}

function loadPlaylist(index) {
  const pl = playlists[index];
  const plTracks = tracks.filter(t => pl.tracks.includes(String(t.id)));
  document.querySelector('[data-view="home"]').click();
  setTimeout(() => {
    renderTracks(plTracks);
    document.querySelector('.section-header h3').textContent = `🎵 ${pl.name}`;
  }, 100);
}

// ===== PLAYBACK =====
function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentIndex = index;
  currentTrack = tracks[index];

  showToast(`Carregando: ${currentTrack.title}...`);
  
  audio.pause();
  audio.src = currentTrack.url;
  audio.load();

  audio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
    updatePlayerInfo();
    renderTracks();
    renderFavorites();
    updateFavoriteButton();
  }).catch(e => {
    console.error('Erro ao reproduzir:', e);
    showToast('Erro ao carregar áudio. Tentando novamente...');
    // Tentar carregar sem crossorigin se falhar
    audio.removeAttribute('crossorigin');
    audio.load();
    audio.play().catch(err => {
        alert('Não foi possível tocar esta música. Verifique sua internet ou se o arquivo existe.');
    });
  });
}

function togglePlay() {
  if (!currentTrack) {
    if (tracks.length > 0) playTrack(0);
    return;
  }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }
  updatePlayButton();
}

function playNext() {
  if (tracks.length === 0) return;
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * tracks.length);
  } else {
    currentIndex = (currentIndex + 1) % tracks.length;
  }
  playTrack(currentIndex);
}

function playPrev() {
  if (tracks.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  playTrack(currentIndex);
}

function updatePlayButton() {
  const btn = document.getElementById('btnPlay');
  btn.textContent = isPlaying ? '⏸' : '▶';
  const artwork = document.getElementById('playerArtwork');
  if (isPlaying) artwork.classList.add('playing');
  else artwork.classList.remove('playing');
}

function updatePlayerInfo() {
  if (!currentTrack) return;
  document.getElementById('playerTitle').textContent = currentTrack.title;
  document.getElementById('playerArtist').textContent = currentTrack.artist;
  document.querySelector('.artwork-placeholder').textContent = getArtworkEmoji(currentTrack.artist);
  document.title = `${currentTrack.title} - JucaSound`;
}

// ===== AUDIO EVENTS =====
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
  document.getElementById('totalTime').textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

audio.addEventListener('loadedmetadata', () => {
  if (currentTrack) {
    currentTrack.duration = audio.duration;
  }
});

// ===== PROGRESS & VOLUME =====
document.getElementById('progressBar').addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = e.target.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

document.getElementById('volumeBar').addEventListener('click', (e) => {
  const rect = e.target.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.volume = pct;
  document.getElementById('volumeFill').style.width = (pct * 100) + '%';
  document.getElementById('btnVolume').textContent = pct === 0 ? '🔇' : pct < 0.5 ? '🔉' : '🔊';
});

// ===== SEARCH =====
function performSearch(query) {
  if (!query.trim()) {
    document.getElementById('searchResults').innerHTML = '<p class="empty-state">Digite algo para buscar nas suas músicas...</p>';
    return;
  }
  const q = query.toLowerCase();
  const results = tracks.filter(t =>
    t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );
  if (results.length === 0) {
    document.getElementById('searchResults').innerHTML = `<p class="empty-state">Nenhum resultado para "${query}" 😕</p>`;
  } else {
    renderTracks(results, 'searchResults');
  }
}

// ===== VISUALIZER =====
let audioCtx, analyser, source, dataArray;

function setupVisualizer() {
  const canvas = document.getElementById('visualizerCanvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  function initAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  audio.addEventListener('play', () => {
    initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });

  function draw() {
    requestAnimationFrame(draw);
    if (!analyser || !isPlaying) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = dataArray.length;
    const barWidth = canvas.width / barCount;
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }
  }
  draw();
}

// HERO BARS
function createHeroBars() {
  const container = document.getElementById('heroVisualizer');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const bar = document.createElement('div');
    const h = 20 + Math.random() * 80;
    bar.style.cssText = `width:4px;height:${h}px;background:linear-gradient(to top,rgba(168,85,247,0.8),rgba(99,102,241,0.3));border-radius:2px;animation:equalize ${0.5 + Math.random() * 0.8}s ease-in-out ${Math.random() * 0.5}s infinite alternate;`;
    container.appendChild(bar);
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Play controls
  document.getElementById('btnPlay').addEventListener('click', togglePlay);
  document.getElementById('btnNext').addEventListener('click', playNext);
  document.getElementById('btnPrev').addEventListener('click', playPrev);

  document.getElementById('btnShuffle').addEventListener('click', () => {
    isShuffle = !isShuffle;
    document.getElementById('btnShuffle').classList.toggle('active', isShuffle);
    showToast(isShuffle ? 'Modo aleatório ativado 🔀' : 'Modo aleatório desativado');
  });

  document.getElementById('btnRepeat').addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('btnRepeat');
    btn.classList.toggle('active', repeatMode > 0);
    btn.textContent = repeatMode === 2 ? '🔂' : '🔁';
    showToast(['Repetição desativada', 'Repetir todas 🔁', 'Repetir uma 🔂'][repeatMode]);
  });

  document.getElementById('btnFavorite').addEventListener('click', () => {
    if (currentTrack) toggleFavorite(currentTrack.id);
  });

  // Upload
  document.getElementById('btnUpload').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', (e) => {
    addLocalFiles(e.target.files);
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    performSearch(e.target.value);
    if (e.target.value.trim()) {
      document.querySelector('[data-view="search"]').click();
    }
  });

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');
      if (view === 'home') renderTracks();
    });
  });

  // Playlist
  document.getElementById('btnNewPlaylist').addEventListener('click', createPlaylist);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.code) {
      case 'Space': e.preventDefault(); togglePlay(); break;
      case 'ArrowRight': playNext(); break;
      case 'ArrowLeft': playPrev(); break;
      case 'ArrowUp': e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.1); break;
      case 'ArrowDown': e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.1); break;
    }
  });
}

// ===== UTILS =====
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
