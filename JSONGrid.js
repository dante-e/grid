'use strict';

// helper methods and properties to create and manipulate DOM elements
const DOMHelper = {
  EXPANDER_TARGET_ATTRIBUTE: 'data-target-id',
  TABLE_SHRINKED_CLASSNAME: 'shrinked',
  JSON_GRID_CONTAINER_CLASSNAME: 'json-grid-container',
  JSON_GRID_ELEMENT_CONTAINER_CLASSNAME: 'json-grid-element-container',
  createElement: (type, valueType, additionalClasses = [], id) => {
    const element = document.createElement(type);
    const classes = Array.isArray(additionalClasses) ? additionalClasses : [additionalClasses];

    if (valueType) classes.push(valueType);
    element.classList.add(...classes);

    if (id) {
      element.id = id;
    }

    return element;
  },
  createExpander: (title, count, target, isObject) => {
    const countBrackets = isObject ? '{}' : '[]';
    const expander = DOMHelper.createElement('span', 'expander');
    expander.textContent = `[${DOMHelper.getExpanderSign(target)}] ${title} ${countBrackets[0]}${count}${countBrackets[1]}`;
    expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, target.id);
    expander.onclick = DOMHelper.onExpanderClick;
    return expander;
  },
  
  onExpanderClick: (event) => {
    const tableId = event.target.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    const target = document.getElementById(tableId);

    if (target) {
      target.classList.toggle(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      event.target.textContent = `[${DOMHelper.getExpanderSign(target)}${event.target.textContent.slice(2)}`;
    }
  },
  getExpanderSign: (target) => {
    return target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME) ? '+' : '-';
  }
}

// represents a grid for displaying JSON data. Has several methods to process and display data in a tabular format
class JSONGrid {
  constructor(data, container) {
    this.data = data;
    this.container = container instanceof HTMLElement ? container : null;
    this.instanceNumber = JSONGrid.instances || 0;
    JSONGrid.instances = (JSONGrid.instances || 0) + 1;
  }
  if (shrinked) {
    // Add the 'shrinked' class to the DOM element
    element.classList.add('shrinked');
  }

// creates table headers for the unique keys found in the array and generates table rows for each object in the array
processArray() {
  const keys = [];
  this.data.forEach((val) => {
    const objKeys = Object.keys(val);
    objKeys.forEach((key) => {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    });
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

    firstTd.appendChild(new JSONGrid(index).generateDOM());
    tr.appendChild(firstTd);

    keys.forEach((key) => {
      const td = DOMHelper.createElement('td', typeof obj, 'table-wrapper');
      const value = obj[key] === undefined || obj[key] === null ? '' : obj[key]; // Change here
      td.appendChild(new JSONGrid(value).generateDOM(key)); // Pass key as an argument here
      tr.appendChild(td);
    });

    return tr;
  });

  return {
    headers: [headers],
    rows: rows,
  };
}


// generates table rows for each key-value pair in the object
  processObject() {
    const keys = Object.keys(this.data);
    const headers = DOMHelper.createElement('tr');

    keys.forEach((value) => {
      const td = DOMHelper.createElement('td');
      td.textContent = `${value}`;
      headers.appendChild(td);
    });

    const rows = keys.map((key) => {
      const tr = DOMHelper.createElement('tr');
      const keyTd = DOMHelper.createElement('td', 'string', 'rowName');
      const value = this.data[key];
      const tdType = typeof value;
      let tdValue;

      if (tdType === 'object' && value) {
        const grid = new JSONGrid(value);
        tdValue = grid.generateDOM(key); // Pass key as an argument here
      } else {
        tdValue = DOMHelper.createElement('span', tdType, 'value');
        tdValue.textContent = `${value}`;
      }

      const valTd = DOMHelper.createElement('td', tdType);

      keyTd.textContent = key;
      valTd.appendChild(tdValue);
      tr.appendChild(keyTd);
      tr.appendChild(valTd);

      return tr;
    });

    return {
      headers: [],
      rows: rows,
    };
  }

  generateDOM(title) {
    let dom;
  
    if (Array.isArray(this.data)) {
      dom = this.processArray();
    } else if (typeof this.data === 'object') {
      dom = this.processObject();
    } else {
      const span = DOMHelper.createElement('span', typeof this.data);
      span.textContent = `${this.data}`;
      return span;
    }
  
    const container = DOMHelper.createElement('div', DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME);
  
      const tableId = `table-${this.instanceNumber}`;
      const initialClasses = this.instanceNumber === 1 ? [] : [DOMHelper.TABLE_SHRINKED_CLASSNAME];
      const table = DOMHelper.createElement('table', 'table', initialClasses, tableId);
      const tbody = DOMHelper.createElement('tbody');
      const isObject = typeof this.data === 'object' && !Array.isArray(this.data);
      const expander = DOMHelper.createExpander(title || dom.rows.length, dom.rows.length, table, isObject);
      container.appendChild(expander);
  
      dom.headers.forEach(val => tbody.appendChild(val));
      dom.rows.forEach(val => tbody.appendChild(val));
  
      table.appendChild(tbody);
      container.appendChild(table);
  
    return container;
  }
  
  

  // renders the JSON data in a tabular format inside the specified container element
  render() {
    if (!this.container || !this.data) {
      return;
    }

    this.container.innerHTML = '';
    this.container.appendChild(this.generateDOM());
    this.container.classList.add(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME);
  }
}

window.JSONGrid = JSONGrid;
