'use strict';
/**
 * RetroGames Hub — a biblioteca nasce vazia e é criada somente com os arquivos
 * encontrados na pasta local autorizada. Nenhuma ISO/BIOS é publicada no GitHub.
 * Play!.js roda em outra origem e solicita o arquivo novamente ao usuário.
 */
(() => {
  const EMULATOR = 'https://playjs.purei.org/';
  const KNOWN_GAMES = {
    nfs: {
      title: 'Need for Speed Underground 2', heading: 'NEED FOR SPEED UNDERGROUND 2',
      studio: 'EA GAMES · 2004', genre: 'Corrida',
      description: 'Personalize seu carro, dispute corridas noturnas e volte às ruas de Bayview.', mark: 'N2'
    },
    'san-andreas': {
      title: 'GTA San Andreas', heading: 'GRAND THEFT AUTO SAN ANDREAS',
      studio: 'ROCKSTAR GAMES · 2004', genre: 'Mundo aberto',
      description: 'Volte a Los Santos e reviva um dos maiores clássicos do PlayStation 2.', mark: 'SA'
    },
    bully: {
      title: 'Bully', heading: 'BULLY', studio: 'ROCKSTAR GAMES · 2006',
      genre: 'Aventura',
      description: 'Explore Bullworth Academy e mergulhe de novo em uma aventura inesquecível.', mark: 'B'
    },
    black: {
      title: 'Black', heading: 'BLACK', studio: 'CRITERION GAMES · 2006',
      genre: 'Tiro / FPS',
      description: 'Ação intensa e cenários explosivos em um dos shooters mais marcantes do PS2.', mark: 'BL'
    },
    'guitar-hero-3': {
      title: 'Guitar Hero III', heading: 'GUITAR HERO III',
      studio: 'ACTIVISION · 2007', genre: 'Música / Ritmo',
      description: 'Escolha sua guitarra, encare os solos e volte a ser uma lenda do rock.', mark: 'III'
    }
  };
  const prefix = 'retrogames-hub:v1:';
  function read(key, fallback) {
    try {
      const value = localStorage.getItem(prefix + key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch {}
  }
  const favArray = read('favorites', []);
  const favorites = new Set(Array.isArray(favArray) ? favArray : []);
  const templates = new Map(
    [...document.getElementById('game-card-templates').content.querySelectorAll('.game[data-id]')]
      .map(card => [card.dataset.id, card])
  );
  const grid = document.getElementById('game-grid');
  const search = document.getElementById('search');
  const dialog = document.getElementById('help-dialog');
  const toast = document.getElementById('toast');
  const featured = document.getElementById('destaque');
  const empty = document.getElementById('empty');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDescription = document.getElementById('empty-description');
  const lastPlayed = document.getElementById('last-played');
  let selected = read('selectedGame', '');
  let available = new Map();
  let favoritesOnly = false;
  let folderReadable = false;
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6500);
  }
  function metadata(entry) {
    const known = KNOWN_GAMES[entry.preset];
    if (known) return known;
    const title = entry.title || entry.fileName;
    const short = title.trim().split(/\s+/).map(word => word[0]).slice(0, 3).join('').toUpperCase() || 'PS2';
    return {
      title, heading: title.toUpperCase(), studio: 'ARQUIVO LOCAL · PLAYSTATION 2',
      genre: 'Jogo de PS2', description: 'Este jogo foi encontrado na sua pasta de ISOs.',
      mark: short
    };
  }
  function makeGenericCard() {
    const card = document.createElement('article');
    card.className = 'game';
    // Modelo estático, sem inserir nomes de arquivos fornecidos pelo usuário como HTML.
    card.innerHTML = `<button class="cover cover-generic" type="button" data-select="" aria-pressed="false">
      <span class="cover-studio">PLAYSTATION 2 <span>JOGO LOCAL</span></span>
      <span class="generic-cover-glyph">✦</span><span class="generic-cover-title"></span>
      <span class="cover-footer">RETROGAMES HUB · PS2</span>
      </button>
      <div class="game-info">
        <div class="game-titleline"><h3></h3>
          <button class="heart" type="button" data-favorite="" aria-pressed="false">♡</button>
        </div>
        <p>Jogo local <span>•</span> PS2</p>
        <div class="game-bottom"><span class="game-engine">◉ Emulador Web</span>
          <button class="btn-play" type="button" data-play="">Jogar ↗</button>
        </div>
      </div>`;
    return card;
  }
  function buildCard(entry) {
    const base = templates.get(entry.preset);
    const card = base ? base.cloneNode(true) : makeGenericCard();
    card.hidden = false;
    card.removeAttribute('hidden');
    card.dataset.id = entry.id;
    card.dataset.search = (entry.title + ' ' + entry.fileName + ' ' + entry.path).toLocaleLowerCase('pt-BR');
    const name = metadata(entry);
    const selection = card.querySelector('[data-select]');
    const play = card.querySelector('[data-play]');
    const favorite = card.querySelector('[data-favorite]');
    selection.dataset.select = entry.id;
    selection.setAttribute('aria-label', 'Selecionar ' + name.title);
    play.dataset.play = entry.id;
    play.setAttribute('aria-label', 'Abrir emulador para ' + name.title);
    favorite.dataset.favorite = entry.id;
    favorite.setAttribute('aria-label', 'Favoritar ' + name.title);
    card.querySelector('.game-titleline h3').textContent = name.title;
    const genericTitle = card.querySelector('.generic-cover-title');
    if (genericTitle) {
      genericTitle.textContent = name.title;
      let hash = 0;
      for (const ch of entry.fileName) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
      card.style.setProperty('--cover-hue', String(198 + Math.abs(hash % 95)));
    }
    const tag = document.createElement('span');
    tag.className = 'game-linked-iso';
    tag.textContent = '✓ ' + entry.fileName;
    tag.title = entry.path;
    card.querySelector('.game-info').append(tag);
    return card;
  }
  function refreshHero() {
    const entry = available.get(selected);
    featured.hidden = !entry;
    if (!entry) return;
    const game = metadata(entry);
    featured.dataset.theme = entry.preset || 'generic';
    document.getElementById('feature-title').textContent = game.heading;
    document.getElementById('feature-studio').textContent = game.studio;
    document.getElementById('feature-description').textContent = game.description;
    document.getElementById('feature-platform').textContent = game.genre + ' · ' + entry.fileName;
    document.getElementById('feature-platform').title = entry.path;
    document.getElementById('feature-symbol').textContent = game.mark;
    document.getElementById('feature-kicker').textContent = 'SELECIONADO NA SUA PASTA · PS2';
    const play = document.getElementById('feature-play');
    play.dataset.play = entry.id;
    play.disabled = false;
    for (const card of grid.querySelectorAll('.game')) {
      const active = card.dataset.id === selected;
      card.classList.toggle('selected', active);
      card.querySelector('[data-select]')?.setAttribute('aria-pressed', String(active));
    }
  }
  function selectGame(id) {
    if (!available.has(id)) return;
    selected = id;
    write('selectedGame', selected);
    refreshHero();
    if (window.matchMedia('(max-width: 760px)').matches) {
      featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function refreshCounters() {
    const count = String(available.size).padStart(2, '0');
    document.getElementById('available-count').textContent = count;
    document.querySelector('.count-box')?.setAttribute('aria-label', available.size + ' jogos disponíveis');
    document.getElementById('nav-count').textContent = count;
    document.getElementById('stats-count').textContent = count;
    document.getElementById('library-count').textContent = '(' + count + ')';
    document.getElementById('favorite-count').textContent =
      String([...favorites].filter(id => available.has(id)).length).padStart(2, '0');
    const recent = read('lastPlayed', '');
    lastPlayed.textContent = available.has(recent) ? metadata(available.get(recent)).title : 'Nenhum ainda';
  }
  function refreshFavorites() {
    for (const button of grid.querySelectorAll('[data-favorite]')) {
      const isFav = favorites.has(button.dataset.favorite);
      button.classList.toggle('active', isFav);
      button.setAttribute('aria-pressed', String(isFav));
      button.textContent = isFav ? '♥' : '♡';
    }
    refreshCounters();
  }
  function filterGames() {
    const query = (search.value || '').trim().toLocaleLowerCase('pt-BR');
    let shown = 0;
    for (const card of grid.querySelectorAll('.game')) {
      const id = card.dataset.id;
      const visible = (!favoritesOnly || favorites.has(id)) &&
        (!query || card.dataset.search.includes(query));
      card.hidden = !visible;
      if (visible) shown++;
    }
    empty.hidden = shown !== 0;
    if (shown) return;
    if (!available.size) {
      emptyTitle.textContent = folderReadable ? 'Nenhum arquivo de jogo na pasta' : 'Sua biblioteca está vazia';
      emptyDescription.textContent = folderReadable
        ? 'Coloque suas ISOs na pasta escolhida e clique em Atualizar. Não aparecem jogos de demonstração.'
        : 'Conecte uma pasta do computador. Somente os jogos encontrados nela serão exibidos.';
    } else {
      emptyTitle.textContent = favoritesOnly ? 'Nenhum favorito encontrado' : 'Nenhum jogo encontrado';
      emptyDescription.textContent = 'Limpe a busca ou desative o filtro de favoritos.';
    }
  }
  function updateFromFolder(event) {
    const data = event?.detail || {};
    folderReadable = data.folderReadable === true;
    const entries = folderReadable && Array.isArray(data.entries) ? data.entries : [];
    // A pasta local é a única fonte de verdade, inclusive quando arquivo ou permissão some.
    available = new Map(entries.filter(entry => entry && typeof entry.id === 'string')
      .map(entry => [entry.id, entry]));
    const cards = document.createDocumentFragment();
    for (const entry of available.values()) cards.append(buildCard(entry));
    grid.replaceChildren(cards);
    if (!available.has(selected)) {
      selected = available.keys().next().value || '';
    }
    refreshHero();
    refreshFavorites();
    filterGames();
  }
  function openGame(id) {
    const entry = available.get(id);
    if (!entry) {
      notify('Conecte uma pasta e selecione uma ISO antes de jogar.');
      return;
    }
    const tab = window.open(EMULATOR, '_blank');
    if (!tab) {
      notify('O navegador bloqueou a nova aba. Permita pop-ups para abrir o Play!.js.');
      return;
    }
    try { tab.opener = null; } catch {}
    write('lastPlayed', id);
    lastPlayed.textContent = metadata(entry).title;
    notify('Emulador aberto. Selecione ' + entry.fileName + ' no Play!.js para iniciar.');
  }

  grid.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !grid.contains(button)) return;
    if (button.hasAttribute('data-favorite')) {
      const id = button.dataset.favorite;
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      write('favorites', [...favorites]);
      refreshFavorites();
      filterGames();
    } else if (button.hasAttribute('data-play')) {
      openGame(button.dataset.play);
    } else if (button.hasAttribute('data-select')) {
      selectGame(button.dataset.select);
    }
  });
  document.getElementById('feature-play').addEventListener('click', event =>
    openGame(event.currentTarget.dataset.play));
  search.addEventListener('input', filterGames);
  document.getElementById('favorites-filter').addEventListener('click', event => {
    favoritesOnly = !favoritesOnly;
    event.currentTarget.classList.toggle('active', favoritesOnly);
    event.currentTarget.setAttribute('aria-pressed', String(favoritesOnly));
    filterGames();
  });
  document.querySelectorAll('[data-help]').forEach(button =>
    button.addEventListener('click', () => dialog.showModal()));
  document.querySelectorAll('[data-close]').forEach(button =>
    button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  const pad = document.getElementById('pad-status');
  function updateGamepad() {
    let connected = false;
    try { connected = Array.from(navigator.getGamepads?.() || []).some(Boolean); } catch {}
    pad.classList.toggle('connected', connected);
    pad.querySelector('span').textContent = connected ? 'Controle detectado' : 'Controle desconectado';
  }
  window.addEventListener('gamepadconnected', updateGamepad);
  window.addEventListener('gamepaddisconnected', updateGamepad);
  window.addEventListener('focus', updateGamepad);
  window.addEventListener('retrogames:folderupdated', updateFromFolder);
  updateGamepad();
  refreshCounters();
  refreshHero();
  filterGames();
})();