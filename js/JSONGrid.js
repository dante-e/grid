import { DOMHelper } from './DOMHelper.js';
import { showPath } from './app.js';

let pathLocked = false;
let lockedCell = null;

export class JSONGrid {
  static instances = 0;

  constructor(data, container, path = 'x') {
    this.data = data;
    this.container = container instanceof HTMLElement ? container : null;
    this.path = path;
    this.instanceNumber = JSONGrid.instances || 0;
    JSONGrid.instances = (JSONGrid.instances || 0) + 1;
  }

  static resetInstanceCounter() {
    JSONGrid.instances = 0;
  }

  processArray() {
    const keys = [];
    this.data.forEach((val) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.keys(val).forEach((key) => {
          if (!keys.includes(key)) keys.push(key);
        });
      }
    });

    const headers = DOMHelper.createElement('tr');
    headers.appendChild(DOMHelper.createElement('th'));
    keys.forEach((value) => {
      const td = DOMHelper.createElement('th');
      td.textContent = value.toString();
      headers.appendChild(td);
    });

    const rows = this.data.map((obj, index) => {
      const tr = DOMHelper.createElement('tr');
      const firstTd = DOMHelper.createElement('td', typeof index);
      const elementPath = `${this.path}[${index}]`;
      firstTd.appendChild(new JSONGrid(index).generateLeafDOM(elementPath));
      tr.appendChild(firstTd);

      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        keys.forEach((key) => {
          const td = DOMHelper.createElement('td', typeof obj[key], 'table-wrapper');
          const value = obj[key] == null ? '' : obj[key];
          const childPath = `${elementPath}.${key}`;
          td.appendChild(new JSONGrid(value, null, childPath).generateDOM(key));
          tr.appendChild(td);
        });
      } else {
        const singleTd = DOMHelper.createElement('td', typeof obj, 'table-wrapper');
        singleTd.colSpan = keys.length;
        singleTd.appendChild(new JSONGrid(obj, null, elementPath).generateDOM(index));
        tr.appendChild(singleTd);
      }
      return tr;
    });
    return { headers: [headers], rows: rows };
  }

  processObject() {
    const keys = Object.keys(this.data);
    const rows = keys.map((key) => {
      const tr = DOMHelper.createElement('tr');
      const keyTd = DOMHelper.createElement('td', 'string', 'rowName');
      const value = this.data[key];
      const tdType = typeof value;
      const childPath = `${this.path}.${key}`;
      let tdValue;
      if (value && typeof value === 'object') {
        const grid = new JSONGrid(value, null, childPath);
        tdValue = grid.generateDOM(key);
      } else {
        tdValue = this.generateLeafDOM(childPath, value);
      }
      const valTd = DOMHelper.createElement('td', tdType);
      keyTd.textContent = key;
      valTd.appendChild(tdValue);
      tr.appendChild(keyTd);
      tr.appendChild(valTd);
      return tr;
    });
    return { headers: [], rows: rows };
  }

  generateLeafDOM(path, value = this.data) {
    const leafSpan = DOMHelper.createElement('span', typeof value, 'value');
    leafSpan.textContent = String(value);
    leafSpan.setAttribute('data-json-path', path);

    setTimeout(() => {
      const td = leafSpan.parentNode;
      if (td && td.tagName === 'TD') {
        td.addEventListener('mouseover', () => {
          td.classList.add('cell-hover');
          if (!pathLocked) showPath(path, false, pathLocked);
        });
        td.addEventListener('mouseout', () => {
          td.classList.remove('cell-hover');
        });
        td.addEventListener('click', () => {
          if (lockedCell === td) {
            td.classList.remove('cell-locked');
            lockedCell = null;
            pathLocked = false;
            const display = document.getElementById('json-path-display');
            if (display) display.textContent = 'Hover over a value to see its path';
          } else {
            if (lockedCell && lockedCell !== td) {
              lockedCell.classList.remove('cell-locked');
            }
            td.classList.add('cell-locked');
            lockedCell = td;
            pathLocked = true;
            showPath(path, true, pathLocked);
          }
        });
      }
    }, 0);
    return leafSpan;
  }

  generateDOM(title) {
    if (Array.isArray(this.data)) {
      const dom = this.processArray();
      return this.buildTableDOM(dom.headers, dom.rows, title, false);
    } else if (this.data && typeof this.data === 'object') {
      const dom = this.processObject();
      return this.buildTableDOM(dom.headers, dom.rows, title, true);
    }
    return this.generateLeafDOM(this.path, this.data);
  }

  buildTableDOM(headers, rows, title, isObject) {
    const container = DOMHelper.createElement('div', DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME);
    const tableId = `table-${this.instanceNumber}`;
    const isOuterTable = this.instanceNumber === 0;
    const initialClasses = isOuterTable ? [] : [DOMHelper.TABLE_SHRINKED_CLASSNAME];
    const table = DOMHelper.createElement('table', 'table', initialClasses, tableId);
    const tbody = DOMHelper.createElement('tbody');

    headers.forEach((val) => tbody.appendChild(val));
    rows.forEach((val) => tbody.appendChild(val));
    table.appendChild(tbody);
    container.appendChild(table);

    if (!isOuterTable) {
      const count = rows.length;
      const expander = DOMHelper.createExpander(title || count, count, table, isObject);
      container.insertBefore(expander, table);
    }
    return container;
  }

  render() {
    if (!this.container || !this.data) return;
    this.container.innerHTML = '';
    const topLevelDom = this.generateDOM();
    this.container.appendChild(topLevelDom);
    this.container.classList.add(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME);
  }
}
