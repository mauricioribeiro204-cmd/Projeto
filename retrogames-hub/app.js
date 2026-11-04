'use strict';
/**
 * RetroGames Hub - biblioteca independente.
 * O botão Jogar abre o Play!.js oficial; a ISO é escolhida lá pelo usuário.
 * Nenhum arquivo comercial é armazenado neste site ou no GitHub.
 */
(() => {
  const EMULATOR = 'https://playjs.purei.org/';
  const GAMES = {
    nfs: 'Need for Speed Underground 2',
    'san-andreas': 'GTA San Andreas',
    bully: 'Bully',
    black: 'Black'
  };
  const prefix = 'retrogames-hub:v1:';
  const safelyRead = (key, fallback) => {
    try { const v = localStorage.getItem(prefix + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  };
  const safelyWrite = (key, data) => {
    try { localStorage.setItem(prefix + key, JSON.stringify(data)); }
    catch { /* bloqueio de armazenamento não impede jogar */ }
  };
  const favorites = new Set(safelyRead('favorites', []).filter(id => Object.hasOwn(GAMES, id)));
  let favoritesOnly = false;
  const search = document.getElementById('search');
  const empty = document.getElementById('empty');
  const cards = [...document.querySelectorAll('.game')];
  const dialog = document.getElementById('help-dialog');
  const toast = document.getElementById('toast');
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 6000);
  }
  function renderFavorites() {
    document.getElementById('favorite-count').textContent = String(favorites.size).padStart(2, '0');
    document.querySelectorAll('[data-favorite]').forEach(button => {
      const checked = favorites.has(button.dataset.favorite);
      button.classList.toggle('active', checked);
      button.setAttribute('aria-pressed', String(checked));
      button.textContent = checked ? '♥' : '♡';
    });
  }
  function renderLastPlayed() {
    const id = safelyRead('lastPlayed', '');
    document.getElementById('last-played').textContent = Object.hasOwn(GAMES, id) ? GAMES[id] : 'Nenhum ainda';
  }
  function filterGames() {
    const value = (search.value || '').trim().toLocaleLowerCase('pt-BR');
    let count = 0;
    for (const card of cards) {
      const id = card.dataset.id;
      const text = card.dataset.search || '';
      const visible = (!favoritesOnly || favorites.has(id)) && (!value || text.includes(value));
      card.hidden = !visible;
      if (visible) count++;
    }
    empty.hidden = count > 0;
  }
  function openGame(id) {
    if (!Object.hasOwn(GAMES, id)) return;
    safelyWrite('lastPlayed', id);
    renderLastPlayed();
    const tab = window.open(EMULATOR, '_blank', 'noopener,noreferrer');
    if (!tab) {
      // Alguns navegadores bloqueiam novas abas; substituir a atual garante acesso.
      window.location.href = EMULATOR;
      return;
    }
    notify('Emulador aberto! Selecione a ISO de ' + GAMES[id] + ' dentro do Play!.js. A escolha não é automática.');
  }
  document.querySelectorAll('[data-play]').forEach(button => {
    button.addEventListener('click', () => openGame(button.dataset.play));
  });
  document.querySelectorAll('[data-favorite]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.favorite;
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      safelyWrite('favorites', [...favorites]);
      renderFavorites();
      filterGames();
    });
  });
  search.addEventListener('input', filterGames);
  document.getElementById('favorites-filter').addEventListener('click', event => {
    favoritesOnly = !favoritesOnly;
    event.currentTarget.classList.toggle('active', favoritesOnly);
    event.currentTarget.setAttribute('aria-pressed', String(favoritesOnly));
    filterGames();
  });
  document.querySelectorAll('[data-help]').forEach(button => button.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  const pad = document.getElementById('pad-status');
  function updateGamepad() {
    let connected = false;
    try { connected = Array.from(navigator.getGamepads?.() || []).some(Boolean); }
    catch { /* API desabilitada */ }
    pad.classList.toggle('connected', connected);
    pad.querySelector('span').textContent = connected ? 'Controle detectado' : 'Controle desconectado';
  }
  window.addEventListener('gamepadconnected', updateGamepad);
  window.addEventListener('gamepaddisconnected', updateGamepad);
  window.addEventListener('focus', updateGamepad);
  updateGamepad();
  renderFavorites();
  renderLastPlayed();
  filterGames();
})();