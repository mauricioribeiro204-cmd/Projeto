'use strict';
/**
 * RetroGames Hub: uma biblioteca local de PS2, inspirada em interfaces de console.
 * Exibe SOMENTE jogos com ISO identificada e acesso à pasta autorizado.
 * Play!.js está em outra origem e exige escolher a ISO novamente no emulador.
 */
(() => {
  const EMULATOR = 'https://playjs.purei.org/';
  const GAMES = {
    nfs: {
      title: 'Need for Speed Underground 2',
      heading: 'NEED FOR SPEED UNDERGROUND 2',
      studio: 'EA GAMES · 2004',
      genre: 'Corrida',
      description: 'Personalize seu carro, dispute corridas noturnas e volte às ruas de Bayview.',
      mark: 'N2'
    },
    'san-andreas': {
      title: 'GTA San Andreas',
      heading: 'GRAND THEFT AUTO SAN ANDREAS',
      studio: 'ROCKSTAR GAMES · 2004',
      genre: 'Mundo aberto',
      description: 'Volte a Los Santos e reviva um dos maiores clássicos do PlayStation 2.',
      mark: 'SA'
    },
    bully: {
      title: 'Bully',
      heading: 'BULLY',
      studio: 'ROCKSTAR GAMES · 2006',
      genre: 'Aventura',
      description: 'Explore Bullworth Academy e mergulhe de novo em uma aventura inesquecível.',
      mark: 'B'
    },
    black: {
      title: 'Black',
      heading: 'BLACK',
      studio: 'CRITERION GAMES · 2006',
      genre: 'Tiro / FPS',
      description: 'Ação intensa e cenários explosivos em um dos shooters mais marcantes do PS2.',
      mark: 'BL'
    },
    'guitar-hero-3': {
      title: 'Guitar Hero III',
      heading: 'GUITAR HERO III',
      studio: 'ACTIVISION · 2007',
      genre: 'Música / Ritmo',
      description: 'Escolha sua guitarra, encare os solos e volte a ser uma lenda do rock.',
      mark: 'III'
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
  const favorites = new Set(Array.isArray(favArray) ? favArray.filter(id => Object.hasOwn(GAMES, id)) : []);
  const cards = [...document.querySelectorAll('.game[data-id]')];
  const search = document.getElementById('search');
  const dialog = document.getElementById('help-dialog');
  const toast = document.getElementById('toast');
  const featured = document.getElementById('destaque');
  const empty = document.getElementById('empty');
  const EMPTY_TITLE = document.getElementById('empty-title');
  const EMPTY_DESCRIPTION = document.getElementById('empty-description');
  const storedSelection = read('selectedGame', '');
  let selected = Object.hasOwn(GAMES, storedSelection) ? storedSelection : '';
  let favoritesOnly = false;
  let availableIds = new Set();
  let folderHasBeenRead = false;
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6500);
  }
  function refreshHero() {
    const game = GAMES[selected];
    const play = document.getElementById('feature-play');
    const heading = document.getElementById('feature-title');
    const studio = document.getElementById('feature-studio');
    const description = document.getElementById('feature-description');
    const platform = document.getElementById('feature-platform');
    const symbol = document.getElementById('feature-symbol');
    const kicker = document.getElementById('feature-kicker');
    const hasGame = !!game && availableIds.has(selected);
    featured.dataset.theme = hasGame ? selected : 'none';
    if (hasGame) {
      heading.textContent = game.heading;
      studio.textContent = game.studio;
      description.textContent = game.description;
      const file = window.RetroISO?.getGameFileName(selected);
      platform.textContent = file ? game.genre + ' · ' + file : game.genre + ' · PS2';
      platform.title = file || '';
      symbol.textContent = game.mark;
      kicker.textContent = 'JOGO SELECIONADO · PLAYSTATION 2';
      play.dataset.play = selected;
      play.disabled = false;
    } else {
      heading.textContent = 'SUA BIBLIOTECA DE JOGOS';
      studio.textContent = 'RETROGAMES HUB · PLAYSTATION 2';
      description.textContent = 'Conecte a pasta de ISOs do seu computador para mostrar somente os jogos disponíveis.';
      platform.textContent = 'Aguardando jogos na sua pasta';
      platform.title = '';
      symbol.textContent = 'PS2';
      kicker.textContent = 'SUA COLEÇÃO PESSOAL';
      play.dataset.play = '';
      play.disabled = true;
    }
    cards.forEach(card => {
      const active = hasGame && card.dataset.id === selected;
      card.classList.toggle('selected', active);
      card.querySelector('[data-select]')?.setAttribute('aria-pressed', String(active));
    });
  }
  function selectGame(id) {
    if (!availableIds.has(id) || !Object.hasOwn(GAMES, id)) return;
    selected = id;
    write('selectedGame', selected);
    refreshHero();
    if (window.matchMedia('(max-width: 760px)').matches) {
      featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function updateCounter() {
    const count = String(availableIds.size).padStart(2, '0');
    document.getElementById('available-count').textContent = count;
    document.querySelector('.count-box')?.setAttribute('aria-label', availableIds.size + ' jogos disponíveis na biblioteca');
    document.getElementById('nav-count').textContent = count;
    document.getElementById('stats-count').textContent = count;
    document.getElementById('library-count').textContent = '(' + count + ')';
  }
  function filterGames() {
    const query = (search.value || '').trim().toLocaleLowerCase('pt-BR');
    let shown = 0;
    for (const card of cards) {
      const id = card.dataset.id;
      const visible = availableIds.has(id)
        && (!favoritesOnly || favorites.has(id))
        && (!query || (card.dataset.search || '').includes(query));
      card.hidden = !visible;
      if (visible) shown++;
    }
    empty.hidden = shown > 0;
    if (shown) return;
    if (!availableIds.size) {
      EMPTY_TITLE.textContent = folderHasBeenRead ? 'Nenhum jogo reconhecido na pasta' : 'Conecte sua pasta de ISOs';
      EMPTY_DESCRIPTION.textContent = folderHasBeenRead
        ? 'Coloque ISOs dos jogos na pasta ou vincule manualmente um arquivo na seção Minhas ISOs.'
        : 'Somente os jogos encontrados na pasta conectada aparecerão nesta biblioteca.';
    } else {
      EMPTY_TITLE.textContent = favoritesOnly ? 'Nenhum favorito encontrado' : 'Nenhum jogo encontrado';
      EMPTY_DESCRIPTION.textContent = 'Tente outro nome ou desative o filtro de favoritos.';
    }
  }
  function refreshFavorites() {
    document.getElementById('favorite-count').textContent = String(favorites.size).padStart(2, '0');
    document.querySelectorAll('[data-favorite]').forEach(button => {
      const isFav = favorites.has(button.dataset.favorite);
      button.classList.toggle('active', isFav);
      button.setAttribute('aria-pressed', String(isFav));
      button.textContent = isFav ? '♥' : '♡';
    });
  }
  function updateFromFolder(event) {
    const detail = event?.detail || {};
    const recognized = Array.isArray(detail.availableIds)
      ? detail.availableIds
      : window.RetroISO?.getAvailableGameIds?.() || [];
    availableIds = new Set(recognized.filter(id => Object.hasOwn(GAMES, id)));
    folderHasBeenRead = detail.folderReadable === true;
    if (!availableIds.has(selected)) {
      selected = cards.find(card => availableIds.has(card.dataset.id))?.dataset.id || '';
    }
    updateCounter();
    filterGames();
    refreshHero();
  }
  function openGame(id) {
    if (!availableIds.has(id) || !Object.hasOwn(GAMES, id)) {
      notify('Conecte uma pasta e vincule a ISO deste jogo antes de jogar.');
      return;
    }
    const iso = window.RetroISO?.getGameFileName(id);
    const tab = window.open(EMULATOR, '_blank');
    if (!tab) {
      notify('O navegador bloqueou a nova aba. Permita pop-ups para abrir o Play!.js.');
      return;
    }
    try { tab.opener = null; } catch {}
    write('lastPlayed', id);
    document.getElementById('last-played').textContent = GAMES[id].title;
    notify(iso
      ? 'Emulador aberto. Selecione ' + iso + ' dentro do Play!.js para jogar.'
      : 'Emulador aberto. Escolha a ISO de ' + GAMES[id].title + ' no Play!.js.');
  }
  document.querySelectorAll('[data-select]').forEach(button =>
    button.addEventListener('click', () => selectGame(button.dataset.select)));
  document.querySelectorAll('[data-play]').forEach(button =>
    button.addEventListener('click', () => openGame(button.dataset.play)));
  document.querySelectorAll('[data-favorite]').forEach(button =>
    button.addEventListener('click', () => {
      const id = button.dataset.favorite;
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      write('favorites', [...favorites]);
      refreshFavorites();
      filterGames();
    }));
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
  refreshFavorites();
  updateCounter();
  refreshHero();
  filterGames();
  const last = read('lastPlayed', '');
  document.getElementById('last-played').textContent = Object.hasOwn(GAMES, last) ? GAMES[last].title : 'Nenhum ainda';
})();