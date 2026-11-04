'use strict';
/**
 * Biblioteca de ISOs locais do usuário (sem upload, sem rede, sem BIOS).
 * Diretório escolhido via showDirectoryPicker e lembrado em IndexedDB.
 * A permissão de leitura pode precisar de renovação em visitas seguintes.
 *
 * IMPORTANTE: Play!.js roda em outra origem. Não podemos entregar a ele os
 * FileSystemFileHandles desta origem nem fazê-lo iniciar a ISO automaticamente.
 */
(() => {
  const prefix = 'retrogames-hub:v1:';
  const DB_NAME = 'retrogames-local-isos';
  const DB_STORE = 'settings';
  const DB_KEY = 'directoryHandle';
  const VALID_EXT = /\.(iso|cso|chd|isz|bin|elf)$/i;
  const names = {
    nfs: 'Need for Speed Underground 2',
    'san-andreas': 'GTA San Andreas',
    bully: 'Bully',
    black: 'Black',
    'guitar-hero-3': 'Guitar Hero III: Legends of Rock'
  };
  const connectBtn = document.getElementById('iso-connect');
  const refreshBtn = document.getElementById('iso-refresh');
  const disconnectBtn = document.getElementById('iso-disconnect');
  const status = document.getElementById('iso-folder-status');
  const folderName = document.getElementById('iso-folder-name');
  const list = document.getElementById('iso-list');
  const counter = document.getElementById('iso-count');
  const fallback = document.getElementById('iso-folder-fallback');
  if (!connectBtn || !status || !list) return;

  let directory = null;
  let files = [];
  let assignments = {};
  let busy = false;
  let folderReadable = false;
  const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
  try { assignments = JSON.parse(localStorage.getItem(prefix + 'iso-assignments') || '{}') || {}; }
  catch { assignments = {}; }

  function saveAssignments() {
    try { localStorage.setItem(prefix + 'iso-assignments', JSON.stringify(assignments)); }
    catch { /* armazenamento pode estar desativado */ }
  }
  function setMessage(message) { status.textContent = message; }
  function showEmpty(message) {
    list.replaceChildren();
    const el = document.createElement('div');
    el.className = 'iso-empty';
    el.textContent = message;
    list.append(el);
  }
  function setBusy(value) {
    busy = value;
    connectBtn.disabled = value;
    refreshBtn.disabled = value || !directory;
    disconnectBtn.disabled = value;
  }
  function dbOpen() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Banco de dados bloqueado'));
    });
  }
  async function dbOperation(kind, value) {
    const db = await dbOpen();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, kind === 'get' ? 'readonly' : 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const request = kind === 'get'
          ? store.get(DB_KEY)
          : kind === 'put'
            ? store.put(value, DB_KEY)
            : store.delete(DB_KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  function cleanName(fileName) {
    return fileName.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function inferGame(fileName) {
    const v = cleanName(fileName);
    if (/(need for speed|nfsu?\s?2|underground\s?2)/.test(v)) return 'nfs';
    if (/(san andreas|gta sa\b|gtasa\b)/.test(v)) return 'san-andreas';
    if (/(\bbully\b|canis canem edit)/.test(v)) return 'bully';
    if (/^black(?:\s|$)/.test(v)) return 'black';
    if (/(\bguitar\s*hero\s*(?:3|iii)\b|\bgh\s*3\b|\blegends of rock\b)/.test(v)) return 'guitar-hero-3';
    return '';
  }
  function pathAssignedToGame(id) {
    return assignments[id] && files.some(f => f.path === assignments[id]) ? assignments[id] : '';
  }
  function chooseAutoMappings() {
    for (const id of Object.keys(names)) {
      if (pathAssignedToGame(id)) continue;
      const matching = files.find(f => inferGame(f.name) === id && !Object.entries(assignments).some(([otherId, path]) => otherId !== id && path === f.path));
      if (matching) assignments[id] = matching.path;
      else delete assignments[id];
    }
    saveAssignments();
  }
  function readableEntries() {
    if (!folderReadable) return [];
    return files.map(file => {
      const manual = Object.keys(names).find(id => assignments[id] === file.path);
      const preset = manual || inferGame(file.name);
      const basename = file.name.replace(/\.[^.]+$/, '');
      // Mostra arquivos novos mesmo que não estejam na lista original de 5 jogos.
      const title = preset ? names[preset] : basename.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
      return { id: 'iso:' + file.path, path: file.path, fileName: file.name, title, preset, size: file.size };
    });
  }
  function updateGameCards() {
    const entries = readableEntries();
    window.dispatchEvent(new CustomEvent('retrogames:folderupdated', {
      detail: { count: files.length, linked: entries.length,
        entries, availableIds: entries.map(entry => entry.id), folderReadable }
    }));
  }
  const prettySize = size => (size / 1024 ** 3 >= 1
    ? (size / 1024 ** 3).toFixed(2) + ' GB'
    : (size / 1024 ** 2).toFixed(1) + ' MB');
  function renderFiles() {
    counter.textContent = files.length + (files.length === 1 ? ' arquivo' : ' arquivos');
    list.replaceChildren();
    if (!files.length) {
      showEmpty('Nenhuma ISO encontrada. Coloque arquivos .iso, .chd, .cso, .isz, .bin ou .elf na pasta e clique em Atualizar.');
      updateGameCards();
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of files) {
      const row = document.createElement('div');
      row.className = 'iso-file';
      const fileIcon = document.createElement('span');
      fileIcon.className = 'iso-file-icon';
      fileIcon.textContent = item.name.split('.').pop().toUpperCase();
      const main = document.createElement('div');
      main.className = 'iso-file-main';
      const title = document.createElement('span');
      title.className = 'iso-file-name';
      title.textContent = item.name;
      const meta = document.createElement('span');
      meta.className = 'iso-file-meta';
      meta.textContent = (item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) + ' · ' : '') +
        (item.size === null ? 'Arquivo local' : prettySize(item.size));
      main.append(title, meta);
      const label = document.createElement('span');
      label.className = 'iso-label';
      label.textContent = 'VINCULAR A';
      const select = document.createElement('select');
      select.className = 'iso-assign';
      select.setAttribute('aria-label', 'Vincular ' + item.name + ' a um jogo');
      for (const [id, labelText] of [['','Sem vínculo'], ...Object.entries(names)]) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = labelText;
        select.append(option);
      }
      select.value = Object.keys(names).find(id => assignments[id] === item.path) || '';
      select.addEventListener('change', () => {
        for (const [id, path] of Object.entries(assignments)) {
          if (path === item.path) delete assignments[id];
        }
        if (select.value) assignments[select.value] = item.path;
        saveAssignments();
        renderFiles();
      });
      const launch = document.createElement('a');
      launch.className = 'iso-launch';
      launch.href = 'https://playjs.purei.org/';
      launch.target = '_blank';
      launch.rel = 'noopener noreferrer';
      launch.textContent = 'Abrir player ↗';
      launch.title = 'A ISO ainda precisa ser selecionada no Play!.js';
      row.append(fileIcon, main, label, select, launch);
      fragment.append(row);
    }
    list.append(fragment);
    updateGameCards();
  }
  async function readDirectoryContents(root) {
    const out = [];
    const limit = 1500;
    async function visit(handle, path, depth) {
      for await (const entry of handle.values()) {
        if (out.length >= limit) return;
        if (entry.kind === 'directory') {
          if (depth < 3 && !/^\./.test(entry.name)) await visit(entry, path + entry.name + '/', depth + 1);
        } else if (entry.kind === 'file' && VALID_EXT.test(entry.name)) {
          let size = null;
          try { size = (await entry.getFile()).size; }
          catch { /* metadados opcionais */ }
          out.push({ path: path + entry.name, name: entry.name, size });
        }
      }
    }
    await visit(root, '', 0);
    return out.sort((a,b) => collator.compare(a.path,b.path));
  }
  async function hasPermission(handle) {
    try { return typeof handle.queryPermission === 'function' && await handle.queryPermission({ mode: 'read' }) === 'granted'; }
    catch { return false; }
  }
  function updateControls() {
    refreshBtn.disabled = !directory || busy;
    disconnectBtn.hidden = !directory;
  }
  async function scanDirectory() {
    if (!directory || busy) return;
    setBusy(true);
    setMessage('Procurando jogos na pasta...');
    try {
      files = await readDirectoryContents(directory);
      folderReadable = true;
      chooseAutoMappings();
      renderFiles();
      setMessage(files.length + (files.length === 1 ? ' jogo encontrado' : ' arquivos de jogo encontrados') + ' · Pasta vinculada apenas neste navegador. Nenhum arquivo enviado.');
      connectBtn.textContent = '◈  Trocar pasta';
    } catch (error) {
      files = [];
      folderReadable = false;
      renderFiles();
      setMessage('Não foi possível ler a pasta. Clique em Reconectar pasta e conceda permissão.');
      connectBtn.textContent = '◈  Reconectar pasta';
    } finally {
      setBusy(false);
      updateControls();
    }
  }
  async function reconnect() {
    if (!directory) return false;
    try {
      if (await hasPermission(directory)) return true;
      if (typeof directory.requestPermission === 'function') {
        return await directory.requestPermission({ mode: 'read' }) === 'granted';
      }
    } catch { /* acesso negado ou indisponível */ }
    return false;
  }
  connectBtn.addEventListener('click', async () => {
    if (busy) return;
    if (!('showDirectoryPicker' in window)) {
      fallback.click();
      return;
    }
    // A seleção requer interação direta do usuário, por isso é chamada antes de outros awaits.
    try {
      const selected = await window.showDirectoryPicker({ mode: 'read', id: 'retrogames-ps2' });
      directory = selected;
      folderName.textContent = selected.name;
      files = [];
      folderReadable = false;
      assignments = {};
      saveAssignments();
      try { await dbOperation('put', selected); }
      catch { setMessage('Pasta conectada por enquanto, mas este navegador não conseguiu lembrar o acesso.'); }
      updateControls();
      await scanDirectory();
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('O navegador não permitiu conectar a pasta. Verifique as permissões.');
    }
  });
  refreshBtn.addEventListener('click', async () => {
    if (busy || !directory) return;
    if (await reconnect()) await scanDirectory();
    else {
      files = [];
      folderReadable = false;
      renderFiles();
      connectBtn.textContent = '◈  Reconectar pasta';
      setMessage('A pasta continua lembrada, mas a permissão expirou. Clique em Atualizar para autorizar novamente ou Trocar pasta.');
    }
  });
  disconnectBtn.addEventListener('click', async () => {
    if (busy) return;
    directory = null;
    files = [];
    folderReadable = false;
    assignments = {};
    saveAssignments();
    try { await dbOperation('delete'); } catch { /* deixa de ser usada nesta sessão */ }
    folderName.textContent = 'Nenhuma pasta conectada';
    setMessage('Conecte uma pasta para localizar os jogos. Nenhuma ISO foi excluída do computador.');
    connectBtn.textContent = '◈  Conectar pasta';
    updateControls();
    renderFiles();
  });
  fallback.addEventListener('change', () => {
    files = [...fallback.files].filter(f => VALID_EXT.test(f.name)).map(f => ({
      name: f.name,
      path: f.webkitRelativePath || f.name,
      size: f.size
    })).sort((a,b) => collator.compare(a.path,b.path));
    directory = null;
    folderReadable = true;
    assignments = {};
    chooseAutoMappings();
    folderName.textContent = files[0]?.path.split('/')[0] || 'Pasta temporária';
    setMessage('Pasta carregada temporariamente. Neste navegador, é necessário escolhê-la novamente após atualizar a página.');
    renderFiles();
    updateControls();
  });
  async function restore() {
    if (!('showDirectoryPicker' in window)) {
      connectBtn.textContent = '◈  Selecionar pasta (temporário)';
      setMessage('Para lembrar uma pasta automaticamente, abra este site no Chrome ou Edge do computador.');
      renderFiles();
      return;
    }
    try {
      const saved = await dbOperation('get');
      if (!saved || saved.kind !== 'directory') {
        updateControls();
        updateGameCards();
        return;
      }
      directory = saved;
      folderName.textContent = saved.name;
      updateControls();
      if (await hasPermission(saved)) await scanDirectory();
      else {
        folderReadable = false;
        connectBtn.textContent = '◈  Trocar pasta';
        refreshBtn.textContent = '↻  Reconectar pasta';
        setMessage('Pasta lembrada! Clique em Reconectar pasta e autorize o acesso para atualizar suas ISOs.');
        showEmpty('Pasta lembrada. Falta renovar a permissão de leitura para mostrar seus arquivos.');
        updateGameCards();
      }
    } catch {
      setMessage('Armazenamento local indisponível. Você ainda pode conectar uma pasta durante esta visita.');
    }
  }
  window.RetroISO = {
    getAvailableGameIds() {
      return readableEntries().map(entry => entry.id);
    },
    getEntries: readableEntries,
    getGameFileName(id) {
      const record = readableEntries().find(entry => entry.id === id);
      if (record) return record.fileName;
      const path = pathAssignedToGame(id);
      return path ? path.split('/').pop() : '';
    },
    getCount: () => files.length
  };
  restore();
})();