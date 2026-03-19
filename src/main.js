import { JSONGrid } from './JSONGrid.js';
import { DOMHelper } from './DOMHelper.js';
import { state, setCurrentData, setMode, setTheme, resetPathState } from './state.js';
import { EditorWrapper } from './editor.js';
import { copyShareURL, saveToURL, loadFromURL, clearURL } from './url.js';
import { downloadJSON, downloadCSV, copyJSONToClipboard } from './export.js';
import { computePathChanges, applyDiffToGrid, clearDiffHighlights } from './diff.js';

// ─── SAMPLE ───────────────────────────────────────────────────────────────────

const SAMPLE = JSON.stringify({
  squadName: 'Super hero squad',
  homeTown: 'Metro City',
  formed: 2016,
  secretBase: 'Super tower',
  active: true,
  members: [
    { index: 0, isActive: false, age: 21, eyeColor: 'blue',  name: 'Bentley Clayton', gender: 'male'   },
    { index: 1, isActive: false, age: 23, eyeColor: 'blue',  name: 'Lela Ramos',      gender: 'female' },
    { index: 2, isActive: true,  age: 38, eyeColor: 'green', name: 'Milagros Becker', gender: 'female' },
    { index: 3, isActive: false, age: 30, eyeColor: 'brown', name: 'Mccoy Barrera',   gender: 'male'   },
    { index: 4, isActive: false, age: 35, eyeColor: 'brown', name: 'Morton Bennett',  gender: 'male'   },
    { index: 5, isActive: true,  age: 20, eyeColor: 'blue',  name: 'Acosta Bird',     gender: 'male'   },
  ],
}, null, 2);

// ─── DOM REFS ─────────────────────────────────────────────────────────────────

const editorMount   = document.getElementById('editor-cm');
const editorLeft    = document.getElementById('editor-left');
const editorRight   = document.getElementById('editor-right');
const editorSingle  = document.getElementById('editor-single');
const editorDual    = document.getElementById('editor-dual');
const editorPanel   = document.getElementById('editor-panel');
const container     = document.getElementById('container');
const pathDisplay   = document.getElementById('json-path-display');
const dropOverlay   = document.getElementById('drop-overlay');
const exportMenu    = document.getElementById('export-menu');
const searchInput   = document.getElementById('search-input');
const searchClear   = document.getElementById('search-clear');
const searchCount   = document.getElementById('search-count');
const btnTheme      = document.getElementById('btn-theme');

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────

const mainEditor = new EditorWrapper(
  editorMount,
  loadFromURL() ?? SAMPLE,
  (val) => { val.trim() ? saveToURL(val) : clearURL(); },
  state.theme,
);

let diffLeftEditor  = null;
let diffRightEditor = null;
let _runDiffBound   = null;

// ─── GRID RENDER ─────────────────────────────────────────────────────────────

function renderGrid(data) {
  setCurrentData(data);
  resetPathState();
  JSONGrid.resetInstanceCounter();
  const grid = new JSONGrid(data, container, 'x', (updated) => {
    setCurrentData(updated);
    mainEditor.setValue(JSON.stringify(updated, null, 2));
    if (state.mode === 'normal') saveToURL(JSON.stringify(updated, null, 2));
  });
  grid.render();
  if (pathDisplay) pathDisplay.textContent = 'Hover over a value to see its path';
}

function parseAndRender(jsonStr) {
  try {
    renderGrid(JSON.parse(jsonStr));
  } catch {
    showToast('Invalid JSON — fix syntax and try again.', 'error');
  }
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────

document.getElementById('btn-grid')?.addEventListener('click', () => {
  parseAndRender(mainEditor.getValue());
});

document.getElementById('btn-format')?.addEventListener('click', () => {
  try {
    mainEditor.setValue(JSON.stringify(JSON.parse(mainEditor.getValue()), null, 2));
  } catch {
    showToast('Cannot format — invalid JSON.', 'error');
  }
});

document.getElementById('btn-clear')?.addEventListener('click', () => {
  mainEditor.setValue('');
  container.innerHTML = '';
  clearURL();
});

document.getElementById('btn-paste')?.addEventListener('click', async () => {
  try {
    mainEditor.setValue(await navigator.clipboard.readText());
  } catch {
    showToast('Could not read clipboard.', 'error');
  }
});

// Share
document.getElementById('btn-share')?.addEventListener('click', async () => {
  try {
    await copyShareURL(mainEditor.getValue());
    flashBtn('btn-share', 'copied!');
  } catch {
    showToast('Could not copy share link.', 'error');
  }
});

// Export dropdown
document.getElementById('btn-export')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = exportMenu.classList.contains('open');
  if (isOpen) {
    exportMenu.classList.remove('open');
  } else {
    // Position the fixed menu next to the button
    const rect = e.currentTarget.getBoundingClientRect();
    exportMenu.style.top  = rect.top + 'px';
    exportMenu.style.left = (rect.right + 6) + 'px';
    exportMenu.classList.add('open');
  }
  document.getElementById('btn-export').setAttribute(
    'aria-expanded', exportMenu.classList.contains('open').toString()
  );
});

exportMenu?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-export]');
  if (!btn) return;
  exportMenu.classList.remove('open');
  if (!state.currentData) { showToast('Nothing to export — render a grid first.', 'error'); return; }
  const fmt = btn.dataset.export;
  if (fmt === 'json')      downloadJSON(state.currentData);
  if (fmt === 'csv')       downloadCSV(state.currentData);
  if (fmt === 'clipboard') {
    copyJSONToClipboard(state.currentData)
      .then(() => flashBtn('btn-export', 'copied!'))
      .catch(() => showToast('Clipboard unavailable.', 'error'));
  }
});

document.addEventListener('click', () => exportMenu?.classList.remove('open'));

// ─── DIFF MODE ───────────────────────────────────────────────────────────────

document.getElementById('btn-diff')?.addEventListener('click', () => {
  state.mode === 'normal' ? enterDiff() : exitDiff();
});

function enterDiff() {
  setMode('diff');
  editorSingle.classList.add('hidden');
  editorDual.classList.remove('hidden');
  const btnDiff = document.getElementById('btn-diff');
  btnDiff.textContent = 'exit diff';
  btnDiff.classList.add('active');
  const cur = mainEditor.getValue();
  diffLeftEditor  = new EditorWrapper(editorLeft,  cur, undefined, state.theme);
  diffRightEditor = new EditorWrapper(editorRight, cur, undefined, state.theme);
  _runDiffBound = runDiff;
  document.getElementById('btn-run-diff')?.addEventListener('click', _runDiffBound);
}

function exitDiff() {
  setMode('normal');
  editorSingle.classList.remove('hidden');
  editorDual.classList.add('hidden');
  const btnDiff = document.getElementById('btn-diff');
  btnDiff.textContent = 'diff';
  btnDiff.classList.remove('active');
  diffLeftEditor?.destroy();  diffLeftEditor  = null;
  diffRightEditor?.destroy(); diffRightEditor = null;
  if (_runDiffBound) {
    document.getElementById('btn-run-diff')?.removeEventListener('click', _runDiffBound);
    _runDiffBound = null;
  }
  clearDiffHighlights(container);
  document.getElementById('diff-legend')?.remove();
}

function runDiff() {
  if (!diffLeftEditor || !diffRightEditor) return;
  try {
    const left  = JSON.parse(diffLeftEditor.getValue());
    const right = JSON.parse(diffRightEditor.getValue());
    renderGrid(right);
    const changes = computePathChanges(left, right);
    applyDiffToGrid(container, changes);
    _showDiffLegend(changes);
  } catch {
    showToast('Both panels must contain valid JSON.', 'error');
  }
}

function _showDiffLegend(changes) {
  document.getElementById('diff-legend')?.remove();
  const total = changes.added.size + changes.removed.size + changes.modified.size;
  const legend = document.createElement('div');
  legend.id = 'diff-legend';
  legend.innerHTML =
    `<span class="pill added">+${changes.added.size} added</span>` +
    `<span class="pill removed">&#8722;${changes.removed.size} removed</span>` +
    `<span class="pill modified">~${changes.modified.size} modified</span>` +
    `<span class="pill total">${total} change${total !== 1 ? 's' : ''}</span>`;
  container.parentElement?.insertBefore(legend, container);
}

// ─── THEME ────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  setTheme(theme);
  mainEditor.setTheme(theme === 'dark');
  diffLeftEditor?.setTheme(theme === 'dark');
  diffRightEditor?.setTheme(theme === 'dark');
  if (btnTheme) btnTheme.textContent = theme === 'dark' ? 'light' : 'dark';
}

btnTheme?.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

// ─── PATH PANEL ──────────────────────────────────────────────────────────────

document.getElementById('copy-path-button')?.addEventListener('click', () => {
  const text = pathDisplay?.textContent ?? '';
  if (!text || text === 'Hover over a value to see its path') return;
  navigator.clipboard.writeText(text).then(() => flashBtn('copy-path-button', 'copied!'));
});

// ─── SEARCH ──────────────────────────────────────────────────────────────────

searchClear?.addEventListener('click', () => {
  searchInput.value = '';
  _removeHighlights();
  _shrinkAll();
  searchCount.textContent = '';
  searchClear.classList.remove('visible');
});

searchInput?.addEventListener('input', _debounce(_search, 400));
searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { searchInput.value = ''; _search(); }
});

function _search() {
  _removeHighlights();
  const query = searchInput.value.trim();
  searchClear?.classList.toggle('visible', query.length > 0);
  if (!query) { _shrinkAll(); if (searchCount) searchCount.textContent = ''; return; }

  let hits = 0;
  container.querySelectorAll('td, th').forEach((el) => {
    const found = _highlight(el, query);
    if (found) { hits += found; _expandAncestors(el); }
  });
  if (searchCount) searchCount.textContent = hits > 0 ? String(hits) : '0';
}

function _removeHighlights() {
  container.querySelectorAll('.highlight').forEach((el) => {
    el.parentNode?.replaceChild(document.createTextNode(el.textContent ?? ''), el);
    el.parentNode?.normalize();
  });
}

function _shrinkAll() {
  container
    .querySelectorAll(`.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME} > .expander`)
    .forEach((exp) => {
      const tid = exp.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
      const t = tid ? document.getElementById(tid) : null;
      if (t && !t.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) exp.click();
    });
}

function _expandAncestors(el) {
  let p = el.parentElement;
  while (p) {
    if (p.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
      p.classList.remove(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      const exp = p.previousElementSibling;
      if (exp?.classList.contains('expander')) {
        const tog = exp.querySelector('.expander-toggle');
        if (tog) tog.textContent = '[-]';
      }
    }
    p = p.parentElement;
  }
}

function _highlight(element, query) {
  let count = 0;
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      const text = child.textContent;
      const regex = new RegExp(`(${_esc(query)})`, 'gi');
      if (regex.test(text)) {
        const html = text.replace(regex, '<mark class="highlight">$1</mark>');
        const frag = document.createElement('span');
        frag.innerHTML = html;
        count += frag.querySelectorAll('.highlight').length;
        element.replaceChild(frag, child);
      }
    } else if (child.nodeType === Node.ELEMENT_NODE && !child.hasAttribute('contenteditable')) {
      count += _highlight(child, query);
    }
  });
  return count;
}

function _esc(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── DRAG & DROP ─────────────────────────────────────────────────────────────

let _dragCount = 0;

editorPanel?.addEventListener('dragenter', (e) => {
  e.preventDefault();
  _dragCount++;
  dropOverlay?.classList.add('visible');
});

editorPanel?.addEventListener('dragleave', () => {
  if (--_dragCount <= 0) { _dragCount = 0; dropOverlay?.classList.remove('visible'); }
});

editorPanel?.addEventListener('dragover', (e) => e.preventDefault());

editorPanel?.addEventListener('drop', (e) => {
  e.preventDefault();
  _dragCount = 0;
  dropOverlay?.classList.remove('visible');
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    showToast('Drop a .json file.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const content = ev.target?.result;
    try {
      JSON.parse(content);
      mainEditor.setValue(content);
      parseAndRender(content);
    } catch {
      showToast('Dropped file contains invalid JSON.', 'error');
    }
  };
  reader.readAsText(file);
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function _debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function flashBtn(id, label, dur = 1500) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = label;
  setTimeout(() => (btn.textContent = orig), dur);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

applyTheme(state.theme);

const urlJson = loadFromURL();
if (urlJson) {
  try { renderGrid(JSON.parse(urlJson)); } catch { /* ignore stale data */ }
}
