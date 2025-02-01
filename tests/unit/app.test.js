// tests/unit/app.test.js
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

let clearEditor,
  paste,
  formatJSON,
  showPath,
  copyJSONPath,
  toggleTheme,
  loadTheme,
  removeHighlights,
  shrinkExpandedTables,
  expandShrinkedTable,
  traverseAndHighlight,
  debounce,
  performSearch;
let DOMHelper, JSONGrid;

beforeAll(async () => {
  document.body.innerHTML = `
    <div id="editor"></div>
    <form class="json-grid-form">
      <button type="submit">grid</button>
    </form>
    <div id="container"></div>
    <span id="json-path-display">Hover over a value to see its path</span>
    <button id="copy-path-button"></button>
    <button id="light-mode-toggle"></button>
    <input type="text" id="search-input" />
    <button id="clearFn"></button>
    <button id="pasteFn"></button>
    <button id="formatFn"></button>
  `;

  window.alert = vi.fn();

  globalThis.ace = {
    _editors: {},
    edit: vi.fn((selector) => {
      const sel = selector.startsWith('#') ? selector : `#${selector}`;
      if (globalThis.ace._editors[sel]) return globalThis.ace._editors[sel];
      const el = document.querySelector(sel);
      if (!el) throw new Error(`No element found for selector: ${selector}`);
      const editorInstance = {
        value: '',
        setValue(val) {
          this.value = val;
        },
        getValue() {
          return this.value;
        },
        setTheme(theme) {
          this.theme = theme;
        },
        session: { setMode: vi.fn() },
      };
      globalThis.ace._editors[sel] = editorInstance;
      return editorInstance;
    }),
  };

  const appModule = await import('../../js/app.js');
  ({
    clearEditor,
    paste,
    formatJSON,
    showPath,
    copyJSONPath,
    toggleTheme,
    loadTheme,
    removeHighlights,
    shrinkExpandedTables,
    expandShrinkedTable,
    traverseAndHighlight,
    debounce,
    performSearch,
  } = appModule);

  const domHelperModule = await import('../../js/DOMHelper.js');
  DOMHelper = domHelperModule.DOMHelper;

  const jsonGridModule = await import('../../js/JSONGrid.js');
  JSONGrid = jsonGridModule.JSONGrid;
});

beforeEach(() => {
  const editorInstance = ace.edit('editor');
  editorInstance.setValue('');
  const container = document.getElementById('container');
  if (container) container.innerHTML = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const jsonPathDisplay = document.getElementById('json-path-display');
  if (jsonPathDisplay)
    jsonPathDisplay.textContent = 'Hover over a value to see its path';
  document.body.className = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('App Module Functions', () => {
  describe('clearEditor', () => {
    it('should clear the editor content', () => {
      const editorInstance = ace.edit('editor');
      editorInstance.setValue('Some content');
      clearEditor();
      expect(editorInstance.getValue()).toBe('');
    });
  });

  describe('paste', () => {
    it('should paste clipboard content into the editor', async () => {
      const editorInstance = ace.edit('editor');
      editorInstance.setValue('');
      const clipboardText = 'Clipboard text';
      navigator.clipboard = { readText: vi.fn().mockResolvedValue(clipboardText) };
      paste();
      await new Promise((r) => setTimeout(r, 0));
      expect(editorInstance.getValue()).toBe(clipboardText);
    });

    it('should log an error when clipboard read fails', async () => {
      const error = new Error('Clipboard error');
      navigator.clipboard = { readText: vi.fn().mockRejectedValue(error) };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      paste();
      await new Promise((r) => setTimeout(r, 0));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to read clipboard contents:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('formatJSON', () => {
    it('should format valid JSON content', () => {
      const editorInstance = ace.edit('editor');
      editorInstance.setValue('{"a":1,"b":2}');
      formatJSON();
      const expected = JSON.stringify(JSON.parse('{"a":1,"b":2}'), null, 2);
      expect(editorInstance.getValue()).toBe(expected);
    });

    it('should alert and log an error for invalid JSON', () => {
      const editorInstance = ace.edit('editor');
      editorInstance.setValue('{"a":1,}');
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      formatJSON();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Invalid JSON data. Please ensure your JSON data is valid before formatting.'
      );
      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('showPath', () => {
    it('should update the path display when not locked', () => {
      const display = document.getElementById('json-path-display');
      display.textContent = 'Initial';
      showPath('test.path', false, false);
      expect(display.textContent).toBe('test.path');
    });

    it('should not update the path display if locked and lock parameter is false', () => {
      const display = document.getElementById('json-path-display');
      display.textContent = 'Initial';
      showPath('new.path', false, true);
      expect(display.textContent).toBe('Initial');
    });

    it('should update the path display if lock parameter is true even when locked', () => {
      const display = document.getElementById('json-path-display');
      display.textContent = 'Initial';
      showPath('new.path', true, true);
      expect(display.textContent).toBe('new.path');
    });
  });

  describe('copyJSONPath', () => {
    it('should copy valid JSON path to clipboard', async () => {
      const display = document.getElementById('json-path-display');
      display.textContent = 'valid.path';
      navigator.clipboard = { writeText: vi.fn().mockResolvedValue() };
      copyJSONPath();
      await new Promise((r) => setTimeout(r, 0));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('valid.path');
    });

    it('should not copy when the display text is the default message', async () => {
      const display = document.getElementById('json-path-display');
      display.textContent = 'Hover over a value to see its path';
      navigator.clipboard = { writeText: vi.fn().mockResolvedValue() };
      copyJSONPath();
      await new Promise((r) => setTimeout(r, 0));
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('toggleTheme and loadTheme', () => {
    it('should toggle the theme and update the editor theme, button text, and localStorage', () => {
      const body = document.body;
      const lightModeToggle = document.getElementById('light-mode-toggle');
      body.className = '';
      const editorInstance = ace.edit('editor');
      editorInstance.theme = 'ace/theme/dracula';
      toggleTheme();
      expect(body.classList.contains('light-mode')).toBe(true);
      expect(editorInstance.theme).toBe('ace/theme/github');
      expect(lightModeToggle.textContent).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('light-mode');
      toggleTheme();
      expect(body.classList.contains('light-mode')).toBe(false);
      expect(editorInstance.theme).toBe('ace/theme/dracula');
      expect(lightModeToggle.textContent).toBe('light');
      expect(localStorage.getItem('theme')).toBe('dark-mode');
    });

    it('should load the stored theme from localStorage', () => {
      const body = document.body;
      const lightModeToggle = document.getElementById('light-mode-toggle');
      const editorInstance = ace.edit('editor');
      localStorage.setItem('theme', 'light-mode');
      loadTheme();
      expect(body.className).toBe('light-mode');
      expect(editorInstance.theme).toBe('ace/theme/github');
      expect(lightModeToggle.textContent).toBe('dark');
      localStorage.setItem('theme', 'dark-mode');
      loadTheme();
      expect(body.className).toBe('dark-mode');
      expect(editorInstance.theme).toBe('ace/theme/dracula');
      expect(lightModeToggle.textContent).toBe('light');
    });
  });
});

describe('Search & Highlight Functions', () => {
  describe('removeHighlights', () => {
    it('should remove any <span class="highlight"> elements from the DOM', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      container.innerHTML = `Hello <span class="highlight">world</span>!`;
      document.body.appendChild(container);
      removeHighlights();
      expect(container.innerHTML.trim()).toBe('Hello world!');
      container.remove();
    });
  });

  describe('shrinkExpandedTables', () => {
    it('should trigger click on expanders whose target tables are not shrinked', () => {
      const container = document.createElement('div');
      container.className = DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME;
      const expander = document.createElement('span');
      expander.classList.add('expander');
      const table = document.createElement('table');
      table.id = 'table-test';
      table.classList.remove(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, table.id);
      const clickSpy = vi.spyOn(expander, 'click');
      container.appendChild(expander);
      document.body.appendChild(container);
      document.body.appendChild(table);
      shrinkExpandedTables();
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
      table.remove();
      container.remove();
    });
  });

  describe('expandShrinkedTable', () => {
    it('should remove the "shrinked" class from the closest ancestor', () => {
      const container = document.createElement('div');
      container.classList.add('shrinked');
      const child = document.createElement('span');
      container.appendChild(child);
      document.body.appendChild(container);
      expandShrinkedTable(child);
      expect(container.classList.contains('shrinked')).toBe(false);
      container.remove();
    });
  });

  describe('traverseAndHighlight', () => {
    it('should wrap matching text in a span with class "highlight"', () => {
      const container = document.createElement('div');
      container.textContent = 'Hello world';
      const found = traverseAndHighlight(container, 'world');
      expect(found).toBe(true);
      const highlightSpan = container.querySelector('.highlight');
      expect(highlightSpan).not.toBeNull();
      expect(highlightSpan.textContent.toLowerCase()).toBe('world');
    });

    it('should return false if no matching text is found', () => {
      const container = document.createElement('div');
      container.textContent = 'Hello world';
      const found = traverseAndHighlight(container, 'xyz');
      expect(found).toBe(false);
    });
  });

  describe('debounce', () => {
    it('should delay the function call until after the wait period', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const debouncedFunc = debounce(func, 500);
      debouncedFunc();
      debouncedFunc();
      debouncedFunc();
      vi.advanceTimersByTime(400);
      expect(func).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('performSearch', () => {
    it('should clear highlights and shrink tables when the search query is empty', () => {
      const searchInput = document.getElementById('search-input');
      searchInput.value = '';
      const table = document.createElement('table');
      table.id = 'table-1';
      table.classList.add(DOMHelper.TABLE_SHRINKED_CLASSNAME);
      const container = document.createElement('div');
      container.className = DOMHelper.JSON_GRID_CONTAINER_CLASSNAME;
      const expander = document.createElement('span');
      expander.classList.add('expander');
      expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, table.id);
      container.appendChild(expander);
      document.body.appendChild(container);
      document.body.appendChild(table);
      performSearch();
      expect(document.querySelectorAll('.highlight').length).toBe(0);
      table.remove();
      container.remove();
    });

    it('should highlight matching text when a query is provided', async () => {
      const searchInput = document.getElementById('search-input');
      searchInput.value = 'test';
      const gridContainer = document.createElement('div');
      gridContainer.className = DOMHelper.JSON_GRID_CONTAINER_CLASSNAME;
      const td = document.createElement('td');
      td.textContent = 'This is a test cell';
      gridContainer.appendChild(td);
      document.body.appendChild(gridContainer);
      performSearch();
      await new Promise((r) => setTimeout(r, 600));
      const highlightSpan = td.querySelector('.highlight');
      expect(highlightSpan).not.toBeNull();
      expect(highlightSpan.textContent).toBe('test');
      gridContainer.remove();
    });
  });
});

describe('JSONGrid', () => {
  beforeAll(() => {
    JSONGrid.resetInstanceCounter();
  });

  it('should generate a leaf DOM element for primitive data', () => {
    const grid = new JSONGrid('hello', null, 'root');
    const leaf = grid.generateLeafDOM('root', 'hello');
    expect(leaf.tagName).toBe('SPAN');
    expect(leaf.textContent).toBe('hello');
    expect(leaf.getAttribute('data-json-path')).toBe('root');
  });

  it('should process object data and generate a table', () => {
    const data = { a: 1, b: 'test' };
    const container = document.createElement('div');
    const grid = new JSONGrid(data, container, 'root');
    const dom = grid.generateDOM();
    expect(dom.querySelector('table')).not.toBeNull();
    const rows = dom.querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should process array data and generate a table', () => {
    const data = [{ a: 1 }, { b: 2 }];
    const container = document.createElement('div');
    const grid = new JSONGrid(data, container, 'root');
    const dom = grid.generateDOM();
    expect(dom.querySelector('table')).not.toBeNull();
    const header = dom.querySelector('tr');
    expect(header).not.toBeNull();
  });

  it('should render into its container', () => {
    const container = document.getElementById('container');
    const data = { key: 'value' };
    const grid = new JSONGrid(data, container, 'root');
    grid.render();
    expect(container.innerHTML).toContain('table');
    expect(container.classList.contains(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME)).toBe(true);
  });
});
