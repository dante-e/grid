"use strict";

/**
 * Helper methods and properties for creating/manipulating DOM elements
 */
const DOMHelper = {
  EXPANDER_TARGET_ATTRIBUTE: "data-target-id",
  TABLE_SHRINKED_CLASSNAME: "shrinked",
  JSON_GRID_CONTAINER_CLASSNAME: "json-grid-container",
  JSON_GRID_ELEMENT_CONTAINER_CLASSNAME: "json-grid-element-container",

  /**
   * Create a DOM element of the given type, optionally adding a "valueType"
   * (which might be "string", "number", etc.), extra CSS classes, and an ID.
   */
  createElement: (type, valueType, additionalClasses = [], id) => {
    const element = document.createElement(type);
    const classes = Array.isArray(additionalClasses) ? additionalClasses : [additionalClasses];

    if (valueType) {
      classes.push(valueType);
    }
    element.classList.add(...classes);

    if (id) {
      element.id = id;
    }

    return element;
  },

  /**
   * Create a clickable "expander" element used for toggling nested tables
   */
  createExpander: (title, count, target, isObject) => {
    const countBrackets = isObject ? "{}" : "[]";
    const expander = DOMHelper.createElement("span", "expander");
    expander.textContent =
      `[${DOMHelper.getExpanderSign(target)}] ${title} ` +
      `${countBrackets[0]}${count}${countBrackets[1]}`;
    expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, target.id);
    expander.onclick = DOMHelper.onExpanderClick;
    return expander;
  },

  /**
   * Handles clicking the expander: toggles .shrinked class on/off the table
   * and updates the +/- sign
   */
  onExpanderClick: (event) => {
    const tableId = event.target.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    const target = document.getElementById(tableId);

    if (target) {
      target.classList.toggle(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      // update the +/- sign
      event.target.textContent =
        `[${DOMHelper.getExpanderSign(target)}]` + event.target.textContent.slice(3);
    }
  },

  /**
   * Returns "+" or "-" depending on whether the table is shrinked
   */
  getExpanderSign: (target) => {
    return target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME) ? "+" : "-";
  },
};

/**
 * A class that converts JSON data (array/object/primitive) into a nested HTML table structure
 */
class JSONGrid {
  /**
   * @param {any} data - JSON data to be displayed
   * @param {HTMLElement} container - The element where we'll render the table
   * @param {string} [path="x"] - The JSON path up to this data (defaults to "x" for root)
   */
  constructor(data, container, path = "x") {
    this.data = data;
    this.container = container instanceof HTMLElement ? container : null;
    this.path = path;
    this.instanceNumber = JSONGrid.instances || 0;
    JSONGrid.instances = (JSONGrid.instances || 0) + 1;
  }

  /**
   * Resets the static counter so that table IDs start fresh each render
   */
  static resetInstanceCounter() {
    JSONGrid.instances = 0;
  }

  /**
   * Converts an array into a tabular representation
   */
  processArray() {
    const keys = [];
    // Gather all keys from object elements in the array
    this.data.forEach((val) => {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const objKeys = Object.keys(val);
        objKeys.forEach((key) => {
          if (!keys.includes(key)) {
            keys.push(key);
          }
        });
      }
    });

    // Build header row
    const headers = DOMHelper.createElement("tr");
    headers.appendChild(DOMHelper.createElement("th")); // top-left corner, for the index
    keys.forEach((value) => {
      const td = DOMHelper.createElement("th");
      td.textContent = value.toString();
      headers.appendChild(td);
    });

    // Build body rows
    const rows = this.data.map((obj, index) => {
      const tr = DOMHelper.createElement("tr");

      // First <td> shows the array index
      const firstTd = DOMHelper.createElement("td", typeof index);
      const elementPath = `${this.path}[${index}]`;
      firstTd.appendChild(new JSONGrid(index).generateLeafDOM(elementPath));
      tr.appendChild(firstTd);

      // If the item is an object, fill each known key in a cell
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        keys.forEach((key) => {
          const td = DOMHelper.createElement("td", typeof obj[key], "table-wrapper");
          const value = obj[key] === undefined || obj[key] === null ? "" : obj[key];
          const childPath = `${elementPath}.${key}`;

          td.appendChild(new JSONGrid(value, null, childPath).generateDOM(key));
          tr.appendChild(td);
        });
      } else {
        // If it's not an object, put it in one cell
        const singleTd = DOMHelper.createElement("td", typeof obj, "table-wrapper");
        singleTd.colSpan = keys.length; // stretch across columns
        singleTd.appendChild(new JSONGrid(obj, null, elementPath).generateDOM(index));
        tr.appendChild(singleTd);
      }

      return tr;
    });

    return {
      headers: [headers],
      rows: rows,
    };
  }

  /**
   * Converts an object into a tabular representation:
   *  Each row is [key, value].
   */
  processObject() {
    const keys = Object.keys(this.data);
    const rows = keys.map((key) => {
      const tr = DOMHelper.createElement("tr");
      const keyTd = DOMHelper.createElement("td", "string", "rowName");
      const value = this.data[key];
      const tdType = typeof value;
      const childPath = `${this.path}.${key}`;

      let tdValue;
      if (value && typeof value === "object") {
        // Nested object or array
        const grid = new JSONGrid(value, null, childPath);
        tdValue = grid.generateDOM(key);
      } else {
        // Leaf value
        tdValue = this.generateLeafDOM(childPath, value);
      }

      const valTd = DOMHelper.createElement("td", tdType);
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

  /**
   * Creates a <span> for leaf values and attaches events to the parent <td>:
   *   - mouseover -> .cell-hover + showPath (if not locked)
   *   - mouseout  -> remove .cell-hover (if not locked)
   *   - click     -> toggle lock on this cell
   */
  generateLeafDOM(path, value = this.data) {
    const leafSpan = DOMHelper.createElement("span", typeof value, "value");
    leafSpan.textContent = String(value);
    leafSpan.setAttribute("data-json-path", path);

    setTimeout(() => {
      const td = leafSpan.parentNode;
      if (td && td.tagName === "TD") {
        // Hover: If not locked, highlight + show path
        td.addEventListener("mouseover", () => {
          // Always highlight on hover, even if locked
          td.classList.add("cell-hover");
          if (!pathLocked) {
            // If not locked, show path
            showPath(path, false);
          }
        });
        // Mouseout: remove hover highlight if not locked
        td.addEventListener("mouseout", () => {
          // We can remove the hover highlight unconditionally,
          // or only if it's not locked. 
          // But typically we want the hover style to go away 
          // even if locked, so let's remove it always:
          td.classList.remove("cell-hover");
        });

        // Click: If same cell => unlock, else lock
        td.addEventListener("click", () => {
          // If the same cell is already locked, unlock it
          if (lockedCell === td) {
            td.classList.remove("cell-locked");
            lockedCell = null;
            pathLocked = false;
            // Reset the path display
            const display = document.getElementById("json-path-display");
            if (display) {
              display.textContent = "Hover over a value to see its path";
            }
          } else {
            // If a different cell was locked, unlock that first
            if (lockedCell && lockedCell !== td) {
              lockedCell.classList.remove("cell-locked");
            }
            // Lock this cell
            td.classList.add("cell-locked");
            lockedCell = td;
            pathLocked = true;
            // Update the display with this path
            showPath(path, true);
          }
        });
      }
    }, 0);

    return leafSpan;
  }

  /**
   * Decides if data is array, object, or leaf and builds the DOM
   */
  generateDOM(title) {
    if (Array.isArray(this.data)) {
      const dom = this.processArray();
      return this.buildTableDOM(dom.headers, dom.rows, title, false);
    } else if (this.data && typeof this.data === "object") {
      const dom = this.processObject();
      return this.buildTableDOM(dom.headers, dom.rows, title, true);
    }
    // else it's a leaf
    return this.generateLeafDOM(this.path, this.data);
  }

  /**
   * Builds an HTML table from header and row <tr> elements,
   * optionally adding an expander if this is nested
   */
  buildTableDOM(headers, rows, title, isObject) {
    const container = DOMHelper.createElement(
      "div",
      DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME
    );

    const tableId = `table-${this.instanceNumber}`;
    const isOuterTable = this.instanceNumber === 0;
    const initialClasses = isOuterTable ? [] : [DOMHelper.TABLE_SHRINKED_CLASSNAME];
    const table = DOMHelper.createElement("table", "table", initialClasses, tableId);
    const tbody = DOMHelper.createElement("tbody");

    headers.forEach((val) => tbody.appendChild(val));
    rows.forEach((val) => tbody.appendChild(val));
    table.appendChild(tbody);
    container.appendChild(table);

    // If not top-level, add an expander
    if (!isOuterTable) {
      const count = rows.length;
      const expander = DOMHelper.createExpander(title || count, count, table, isObject);
      container.insertBefore(expander, table);
    }

    return container;
  }

  /**
   * Renders this JSONGrid instance into its container
   */
  render() {
    if (!this.container || !this.data) {
      return;
    }
    this.container.innerHTML = "";
    const topLevelDom = this.generateDOM();
    this.container.appendChild(topLevelDom);
    this.container.classList.add(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME);
  }
}

window.JSONGrid = JSONGrid;
