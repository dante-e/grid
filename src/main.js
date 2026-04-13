import { JSONGrid } from './JSONGrid.js';
import { DOMHelper } from './DOMHelper.js';
import { state, setCurrentData, setMode, setTheme, resetPathState, setInputFormat, setRawOriginal } from './state.js';
import { EditorWrapper } from './editor.js';
import { copyShareURL, saveToURL, loadFromURL, clearURL } from './url.js';
import { downloadJSON, downloadCSV, copyJSONToClipboard, downloadXML } from './export.js';
import { computePathChanges, applyDiffToGrid, clearDiffHighlights } from './diff.js';
import { inferSchema, summarizeSchema } from './schema.js';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

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
const xmlBadge      = document.getElementById('xml-badge');

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────

const mainEditor = new EditorWrapper(
  editorMount,
  loadFromURL() ?? SAMPLE,
  (val) => {
    if (val.trim()) {
      saveToURL(val);
      // Auto-switch language so the JSON linter doesn't fire on XML content.
      if (looksLikeXML(val)) {
        mainEditor.setLanguage('xml');
        setInputFormat('xml');
      } else {
        mainEditor.setLanguage('json');
        setInputFormat('json');
      }
    } else {
      clearURL();
      mainEditor.setLanguage('json');
      setInputFormat('json');
    }
  },
  state.theme,
);

let diffLeftEditor  = null;
let diffRightEditor = null;
let _runDiffBound   = null;
let _diffMatchEls   = [];
let _diffIdx        = -1;

// ─── SCHEMA STATE ───────────────────────────────────────────────────────────
let _fullSchema = null;

// ─── GRID RENDER ─────────────────────────────────────────────────────────────

/**
 * Full render: updates state and rebuilds the DOM from canonical data.
 * Call this whenever new data is loaded (paste, file drop, URL, diff).
 */
function renderGrid(data) {
  setCurrentData(data);
  resetPathState();
  _renderDOM(data);
}

/**
 * DOM-only render: rebuilds the grid from `data` without touching state.currentData.
 */
function _renderDOM(data) {
  JSONGrid.resetInstanceCounter();
  const grid = new JSONGrid(data, container, 'x', (updated) => {
    setCurrentData(updated);
    // Only sync editor + URL when the original source was JSON;
    // XML source editor is read-only so we leave it unchanged.
    if (state.inputFormat === 'json') {
      mainEditor.setValue(JSON.stringify(updated, null, 2));
      if (state.mode === 'normal') saveToURL(JSON.stringify(updated, null, 2));
    }
  });
  grid.render();
  if (pathDisplay) pathDisplay.textContent = 'Hover over a value to see its path';
  // Keep schema panel in sync if it's currently open.
  if (!document.getElementById('schema-panel')?.classList.contains('hidden')) {
    refreshSchemaPanel();
  }
}

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

/** Rebuild the schema table from state.currentData and cache the full schema. */
function refreshSchemaPanel() {
  const panel = document.getElementById('schema-panel');
  if (!panel || !state.currentData) return;
  _fullSchema = inferSchema(state.currentData);
  const rows = summarizeSchema(_fullSchema);

  const tbody = panel.querySelector('.schema-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rows.forEach(({ path, depth, types, nullable }) => {
    const tr = document.createElement('tr');

    const pathTd = document.createElement('td');
    pathTd.style.paddingLeft = `${8 + depth * 14}px`;
    pathTd.textContent = path;

    const typesTd = document.createElement('td');
    if (types.length === 0) {
      typesTd.textContent = '—';
    } else {
      types.forEach((type) => {
        const span = document.createElement('span');
        span.className = `type-badge type-${type}`;
        span.textContent = type;
        typesTd.appendChild(span);
      });
    }

    const nullTd = document.createElement('td');
    nullTd.className = 'nullable-cell';
    nullTd.textContent = nullable ? '✓' : '';

    tr.appendChild(pathTd);
    tr.appendChild(typesTd);
    tr.appendChild(nullTd);
    tbody.appendChild(tr);
  });
}

document.getElementById('btn-schema')?.addEventListener('click', () => {
  const panel = document.getElementById('schema-panel');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  document.getElementById('btn-schema')?.classList.toggle('active', isHidden);
  if (isHidden) {
    if (!state.currentData) {
      showToast('Render a grid first to infer schema.', 'error');
      panel.classList.add('hidden');
      document.getElementById('btn-schema')?.classList.remove('active');
      return;
    }
    refreshSchemaPanel();
  }
});

document.getElementById('btn-schema-close')?.addEventListener('click', () => {
  document.getElementById('schema-panel')?.classList.add('hidden');
  document.getElementById('btn-schema')?.classList.remove('active');
});

document.getElementById('btn-copy-schema')?.addEventListener('click', async () => {
  if (!_fullSchema) {
    showToast('No schema to copy \u2014 open the schema panel first.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(_fullSchema, null, 2));
    flashBtn('btn-copy-schema', 'copied!');
  } catch {
    showToast('Clipboard unavailable.', 'error');
  }
});

// ─── XML HELPERS ─────────────────────────────────────────────────────────────

/** Returns true if the trimmed string looks like XML markup. */
function looksLikeXML(str) {
  const s = str.trimStart();
  return s.startsWith('<?xml') || /^<[A-Za-z]/.test(s);
}

/** Shared XMLParser instance. */
const _xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  isArray: () => false,
  trimValues: true,
});

/** Shared XMLBuilder instance (used for formatting and XML export). */
const _xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
});

/** Parse an XML string into a plain JS object tree. */
function _parseXML(xmlStr) {
  return _xmlParser.parse(xmlStr);
}

/** Pretty-print an XML string by round-tripping through the parser. */
function _formatXML(xmlStr) {
  return _xmlBuilder.build(_parseXML(xmlStr));
}

/** Activate XML mode: switch editor language, show badge. */
function _enterXMLMode(rawXml) {
  setInputFormat('xml');
  setRawOriginal(rawXml);
  mainEditor.setLanguage('xml');
  xmlBadge?.classList.remove('hidden');
}

/** Deactivate XML mode: switch editor language back, hide badge. */
function _exitXMLMode() {
  setInputFormat('json');
  setRawOriginal(null);
  mainEditor.setLanguage('json');
  xmlBadge?.classList.add('hidden');
}

function parseAndRender(rawStr) {
  if (!rawStr?.trim()) return;
  try {
    if (looksLikeXML(rawStr)) {
      const data = _parseXML(rawStr);
      _enterXMLMode(rawStr);
      renderGrid(data);
    } else {
      _exitXMLMode();
      renderGrid(JSON.parse(rawStr));
    }
  } catch (err) {
    const isXml = looksLikeXML(rawStr);
    showToast(`Invalid ${isXml ? 'XML' : 'JSON'} — fix syntax and try again.`, 'error');
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
  if (state.inputFormat === 'xml') {
    try {
      mainEditor.setValue(_formatXML(mainEditor.getValue()));
    } catch {
      showToast('Cannot format \u2014 invalid XML.', 'error');
    }
    return;
  }
  try {
    mainEditor.setValue(JSON.stringify(JSON.parse(mainEditor.getValue()), null, 2));
  } catch {
    showToast('Cannot format — invalid JSON.', 'error');
  }
});

document.getElementById('btn-clear')?.addEventListener('click', () => {
  _exitXMLMode();
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

// “Edit as JSON” — unlock XML read-only and convert source to JSON in editor
document.getElementById('btn-unlock-xml')?.addEventListener('click', () => {
  const json = JSON.stringify(state.currentData, null, 2);
  _exitXMLMode();
  mainEditor.setValue(json);
  saveToURL(json);
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
  if (fmt === 'xml')       downloadXML(state.currentData);
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
  const lang = state.inputFormat;
  diffLeftEditor  = new EditorWrapper(editorLeft,  cur, undefined, state.theme);
  diffRightEditor = new EditorWrapper(editorRight, cur, undefined, state.theme);
  if (lang === 'xml') {
    diffLeftEditor.setLanguage('xml');
    diffRightEditor.setLanguage('xml');
  }
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
  _diffMatchEls = [];
  _diffIdx = -1;
}

function runDiff() {
  if (!diffLeftEditor || !diffRightEditor) return;
  try {
    const leftStr  = diffLeftEditor.getValue();
    const rightStr = diffRightEditor.getValue();

    // Auto-detect XML or JSON for each panel independently
    const left  = looksLikeXML(leftStr)  ? _parseXML(leftStr)  : JSON.parse(leftStr);
    const right = looksLikeXML(rightStr) ? _parseXML(rightStr) : JSON.parse(rightStr);

    // If both panels changed language, update editor syntax highlights
    if (looksLikeXML(leftStr)  && diffLeftEditor.setLanguage)  diffLeftEditor.setLanguage('xml');
    if (looksLikeXML(rightStr) && diffRightEditor.setLanguage) diffRightEditor.setLanguage('xml');

    renderGrid(right);
    const changes = computePathChanges(left, right);
    applyDiffToGrid(container, changes);

    // Expand all ancestors of changed nodes so they’re visible immediately
    container.querySelectorAll('.diff-added, .diff-removed, .diff-modified').forEach((el) => {
      _expandAncestors(el);
    });

    // Build navigation list (in DOM order — querySelectorAll guarantees this)
    _diffMatchEls = [...container.querySelectorAll(
      'span.diff-added, span.diff-removed, span.diff-modified'
    )];
    _diffIdx = _diffMatchEls.length > 0 ? 0 : -1;

    _showDiffLegend(changes);
    _goToDiff(); // jump to first change
  } catch {
    showToast('Both panels must contain valid JSON or XML.', 'error');
  }
}

function _showDiffLegend(changes) {
  document.getElementById('diff-legend')?.remove();
  const total = changes.added.size + changes.removed.size + changes.modified.size;
  const legend = document.createElement('div');
  legend.id = 'diff-legend';

  // Navigation controls (only when there are changes)
  const navHtml = total > 0
    ? `<button class="diff-nav-btn" id="diff-prev" aria-label="Previous change">↑</button>` +
      `<span class="diff-nav-counter" id="diff-nav-counter">${_diffIdx + 1}/${_diffMatchEls.length}</span>` +
      `<button class="diff-nav-btn" id="diff-next" aria-label="Next change">↓</button>`
    : '';

  legend.innerHTML =
    navHtml +
    `<span class="pill added">+${changes.added.size} added</span>` +
    `<span class="pill removed">&#8722;${changes.removed.size} removed</span>` +
    `<span class="pill modified">~${changes.modified.size} modified</span>` +
    `<span class="pill total">${total} change${total !== 1 ? 's' : ''}</span>`;

  container.parentElement?.insertBefore(legend, container);

  document.getElementById('diff-prev')?.addEventListener('click', _diffPrev);
  document.getElementById('diff-next')?.addEventListener('click', _diffNext);
}

function _goToDiff() {
  // Remove previous active highlight
  container.querySelectorAll('.diff-nav-active')
    .forEach((el) => el.classList.remove('diff-nav-active'));
  if (_diffIdx < 0 || !_diffMatchEls[_diffIdx]) return;
  const el = _diffMatchEls[_diffIdx];
  el.classList.add('diff-nav-active');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const counter = document.getElementById('diff-nav-counter');
  if (counter) counter.textContent = `${_diffIdx + 1}/${_diffMatchEls.length}`;
}

function _diffNext() {
  if (!_diffMatchEls.length) return;
  _diffIdx = (_diffIdx + 1) % _diffMatchEls.length;
  _goToDiff();
}

function _diffPrev() {
  if (!_diffMatchEls.length) return;
  _diffIdx = (_diffIdx - 1 + _diffMatchEls.length) % _diffMatchEls.length;
  _goToDiff();
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

let _matchEls = [];
let _matchIdx = -1;

searchClear?.addEventListener('click', () => {
  searchInput.value = '';
  _clearSearch();
  searchClear.classList.remove('visible');
});

searchInput?.addEventListener('input', _debounce(_search, 300));
searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { searchInput.value = ''; _clearSearch(); searchClear?.classList.remove('visible'); }
  if (e.key === 'Enter')  { e.preventDefault(); e.shiftKey ? _prevMatch() : _nextMatch(); }
});

document.getElementById('search-prev')?.addEventListener('click', _prevMatch);
document.getElementById('search-next')?.addEventListener('click', _nextMatch);

function _search() {
  _clearSearch();
  const query = searchInput.value.trim();
  searchClear?.classList.toggle('visible', query.length > 0);
  if (!query) return;

  // Highlight all matches and expand their ancestors.
  // Only target leaf nodes (value spans, header cells, row-name cells) to
  // avoid double-processing the same text through nested table recursion.
  container.querySelectorAll('span[data-json-path], th, td.rowName').forEach((el) => {
    if (_highlight(el, query)) _expandAncestors(el);
  });

  // Hide data rows that contain no match (header rows are kept)
  container.querySelectorAll('tr').forEach((tr) => {
    if (tr.querySelector('td') && !tr.querySelector('mark.highlight')) {
      tr.classList.add('search-hidden');
    }
  });

  // Build navigation list and jump to first match
  _matchEls = [...container.querySelectorAll('mark.highlight')];
  _matchIdx = _matchEls.length > 0 ? 0 : -1;
  _goToMatch();
  _updateCounter();
  const hasMatches = _matchEls.length > 0;
  document.getElementById('search-prev')?.classList.toggle('visible', hasMatches);
  document.getElementById('search-next')?.classList.toggle('visible', hasMatches);
}

function _clearSearch() {
  _removeHighlights();
  _showAllRows();
  _shrinkAll();
  _matchEls = [];
  _matchIdx = -1;
  if (searchCount) searchCount.textContent = '';
  document.getElementById('search-prev')?.classList.remove('visible');
  document.getElementById('search-next')?.classList.remove('visible');
}

function _nextMatch() {
  if (!_matchEls.length) return;
  _matchIdx = (_matchIdx + 1) % _matchEls.length;
  _goToMatch();
  _updateCounter();
}

function _prevMatch() {
  if (!_matchEls.length) return;
  _matchIdx = (_matchIdx - 1 + _matchEls.length) % _matchEls.length;
  _goToMatch();
  _updateCounter();
}

function _goToMatch() {
  container.querySelectorAll('mark.highlight-active')
    .forEach((el) => el.classList.remove('highlight-active'));
  if (_matchIdx < 0 || !_matchEls[_matchIdx]) return;
  const el = _matchEls[_matchIdx];
  el.classList.add('highlight-active');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function _updateCounter() {
  if (!searchCount) return;
  searchCount.textContent = _matchEls.length
    ? `${_matchIdx + 1}/${_matchEls.length}`
    : '0';
}

function _removeHighlights() {
  container.querySelectorAll('.highlight').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
      parent.normalize();
    }
  });
}

function _showAllRows() {
  container.querySelectorAll('tr.search-hidden')
    .forEach((tr) => tr.classList.remove('search-hidden'));
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
    } else if (child.nodeType === Node.ELEMENT_NODE) {
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
  const isJSON = file.name.endsWith('.json') || file.type === 'application/json';
  const isXML  = file.name.endsWith('.xml')  || file.type === 'application/xml' || file.type === 'text/xml';
  if (!isJSON && !isXML) {
    showToast('Drop a .json or .xml file.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const content = ev.target?.result;
    mainEditor.setValue(content);
    parseAndRender(content);
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

// Ctrl+Enter (or Cmd+Enter on Mac) renders the grid in normal mode,
// or runs the diff in diff mode — works even while the editor has focus.
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (state.mode === 'normal') parseAndRender(mainEditor.getValue());
    else if (state.mode === 'diff') runDiff();
  }
});

const _urlRaw = loadFromURL();
if (_urlRaw) {
  parseAndRender(_urlRaw);
}
