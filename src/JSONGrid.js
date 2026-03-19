import { DOMHelper } from './DOMHelper.js';
import { state, lockPath, unlockPath } from './state.js';

export class JSONGrid {
  static instances = 0;

  /**
   * @param {*}           data
   * @param {HTMLElement} [container]
   * @param {string}      [path]
   * @param {Function}    [onDataChange]
   */
  constructor(data, container, path = 'x', onDataChange) {
    this.data = data;
    this.container = container instanceof HTMLElement ? container : null;
    this.path = path;
    this.instanceNumber = JSONGrid.instances;
    JSONGrid.instances++;
    this.onDataChange = onDataChange;
  }

  static resetInstanceCounter() {
    JSONGrid.instances = 0;
  }

  // ─── Array processing ────────────────────────────────────────────────────────

  _processArray() {
    const keys = [];
    this.data.forEach((val) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.keys(val).forEach((k) => { if (!keys.includes(k)) keys.push(k); });
      }
    });

    const headerRow = DOMHelper.createElement('tr');
    headerRow.appendChild(DOMHelper.createElement('th'));
    keys.forEach((key) => {
      const th = DOMHelper.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
    });

    const rows = this.data.map((obj, index) => {
      const tr = DOMHelper.createElement('tr');
      const elementPath = `${this.path}[${index}]`;

      const firstTd = DOMHelper.createElement('td', 'number');
      firstTd.appendChild(this.generateLeafDOM(elementPath, index));
      tr.appendChild(firstTd);

      if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
        keys.forEach((key) => {
          const value = obj[key];
          const childPath = `${elementPath}.${key}`;
          const td = DOMHelper.createElement('td', typeof value, 'table-wrapper');
          td.appendChild(
            new JSONGrid(value ?? null, null, childPath, this.onDataChange).generateDOM(key)
          );
          tr.appendChild(td);
        });
      } else {
        const singleTd = DOMHelper.createElement('td', typeof obj, 'table-wrapper');
        singleTd.colSpan = Math.max(keys.length, 1);
        singleTd.appendChild(
          new JSONGrid(obj, null, elementPath, this.onDataChange).generateDOM(index)
        );
        tr.appendChild(singleTd);
      }

      return tr;
    });

    return { headers: [headerRow], rows };
  }

  // ─── Object processing ───────────────────────────────────────────────────────

  _processObject() {
    const rows = Object.keys(this.data).map((key) => {
      const tr = DOMHelper.createElement('tr');
      const keyTd = DOMHelper.createElement('td', 'string', 'rowName');
      keyTd.textContent = key;

      const value = this.data[key];
      const childPath = `${this.path}.${key}`;
      let content;
      if (value !== null && typeof value === 'object') {
        content = new JSONGrid(value, null, childPath, this.onDataChange).generateDOM(key);
      } else {
        content = this.generateLeafDOM(childPath, value);
      }

      const valTd = DOMHelper.createElement('td', typeof value);
      valTd.appendChild(content);
      tr.appendChild(keyTd);
      tr.appendChild(valTd);
      return tr;
    });

    return { headers: [], rows };
  }

  // ─── Leaf nodes ──────────────────────────────────────────────────────────────

  generateLeafDOM(path, value = this.data) {
    const typeClass = value === null ? 'null' : typeof value;
    const span = DOMHelper.createElement('span', typeClass, 'value');
    span.textContent = value === null ? 'null' : String(value);
    span.setAttribute('data-json-path', path);
    span.setAttribute('data-value-type', typeClass);
    return span;
  }

  // ─── DOM assembly ────────────────────────────────────────────────────────────

  generateDOM(title) {
    if (Array.isArray(this.data)) {
      const { headers, rows } = this._processArray();
      return this._buildTableDOM(headers, rows, title, false);
    }
    if (this.data !== null && typeof this.data === 'object') {
      const { headers, rows } = this._processObject();
      return this._buildTableDOM(headers, rows, title, true);
    }
    return this.generateLeafDOM(this.path, this.data);
  }

  _buildTableDOM(headers, rows, title, isObject) {
    const wrapper = document.createElement('div');
    wrapper.className = DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME;

    const tableId = `table-${this.instanceNumber}`;
    const isOuter = this.instanceNumber === 0;
    const initialClasses = isOuter ? [] : [DOMHelper.TABLE_SHRINKED_CLASSNAME];
    const table = DOMHelper.createElement('table', undefined, initialClasses, tableId);
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', String(title ?? 'root'));

    const tbody = DOMHelper.createElement('tbody');
    headers.forEach((h) => tbody.appendChild(h));
    rows.forEach((r) => tbody.appendChild(r));
    table.appendChild(tbody);
    wrapper.appendChild(table);

    if (!isOuter) {
      const expander = DOMHelper.createExpander(
        title ?? rows.length,
        rows.length,
        table,
        isObject,
      );
      wrapper.insertBefore(expander, table);
    }

    return wrapper;
  }

  // ─── Post-render listeners (no setTimeout hack) ──────────────────────────────

  _attachListeners(root) {
    const pathDisplay = document.getElementById('json-path-display');

    root.querySelectorAll('[data-json-path]').forEach((span) => {
      const path = span.getAttribute('data-json-path');
      const td = span.closest('td');

      // Path hover / click-lock
      if (td) {
        td.addEventListener('mouseover', () => {
          td.classList.add('cell-hover');
          if (!state.pathLocked && pathDisplay) {
            pathDisplay.textContent = path;
          }
        });
        td.addEventListener('mouseout', () => td.classList.remove('cell-hover'));
        td.addEventListener('click', (e) => {
          if (e.target.hasAttribute('contenteditable') && e.target !== td) return;
          if (state.lockedCell === td) {
            unlockPath();
            if (pathDisplay) pathDisplay.textContent = 'Hover over a value to see its path';
          } else {
            lockPath(td);
            if (pathDisplay) pathDisplay.textContent = path;
          }
        });
      }

      // Inline editing
      span.setAttribute('contenteditable', 'true');
      span.setAttribute('spellcheck', 'false');
      span.classList.add('editable');

      let originalText = span.textContent ?? '';

      span.addEventListener('focus', () => {
        originalText = span.textContent ?? '';
        // Select all text on focus for easy replacement
        const range = document.createRange();
        range.selectNodeContents(span);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });

      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
        if (e.key === 'Escape') { span.textContent = originalText; span.blur(); }
      });

      span.addEventListener('blur', () => {
        const raw = (span.textContent ?? '').trim();
        if (raw === originalText) return;
        const hint = span.getAttribute('data-value-type') ?? 'string';
        const parsed = JSONGrid.parseTypedValue(raw, hint);
        const newType = parsed === null ? 'null' : typeof parsed;
        span.className = `value ${newType} editable`;
        span.setAttribute('data-value-type', newType);
        span.textContent = parsed === null ? 'null' : String(parsed);

        if (this.onDataChange && state.currentData !== null) {
          const updated = JSONGrid.setValueAtPath(state.currentData, path, parsed);
          this.onDataChange(updated);
        }
      });
    });
  }

  // ─── Path / value utilities ──────────────────────────────────────────────────

  static parseTypedValue(raw, hint) {
    if (raw === 'null') return null;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (hint === 'number' || (raw !== '' && !isNaN(Number(raw)))) return Number(raw);
    return raw;
  }

  static setValueAtPath(root, path, value) {
    let cleanPath = path;
    if      (cleanPath.startsWith('x['))  cleanPath = cleanPath.slice(1);
    else if (cleanPath.startsWith('x.'))  cleanPath = cleanPath.slice(2);
    else if (cleanPath === 'x')           return value;

    const tokens = cleanPath.match(/[^.[\]]+/g);
    if (!tokens || tokens.length === 0) return value;

    const clone = JSON.parse(JSON.stringify(root));
    let cursor = clone;
    for (let i = 0; i < tokens.length - 1; i++) {
      if (cursor == null) return root;
      cursor = cursor[tokens[i]];
    }
    if (cursor != null) cursor[tokens[tokens.length - 1]] = value;
    return clone;
  }

  // ─── Public render ───────────────────────────────────────────────────────────

  render() {
    if (!this.container || this.data == null) return;
    this.container.innerHTML = '';
    const dom = this.generateDOM();
    this.container.appendChild(dom);
    this.container.classList.add(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME);
    this._attachListeners(this.container);
  }
}
