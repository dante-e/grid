import { JSONGrid } from './JSONGrid.js';
import { DOMHelper } from './DOMHelper.js';

const editor = ace.edit('editor');
editor.setTheme('ace/theme/dracula');
editor.session.setMode('ace/mode/json');

export function clearEditor() {
  editor.setValue('');
}

export function paste() {
  navigator.clipboard
    .readText()
    .then((clipboardText) => {
      editor.setValue(clipboardText);
      console.log('pasted');
    })
    .catch((err) => {
      console.error('Failed to read clipboard contents:', err);
    });
}

export function formatJSON() {
  try {
    const unformattedJSON = JSON.parse(editor.getValue());
    const formattedJSON = JSON.stringify(unformattedJSON, null, 2);
    editor.setValue(formattedJSON);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    alert(
      'Invalid JSON data. Please ensure your JSON data is valid before formatting.'
    );
  }
}

const container = document.getElementById('container');

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = editor.getValue();
  JSONGrid.resetInstanceCounter();
  const parsed = JSON.parse(data);
  const jsonGrid = new JSONGrid(parsed, container, 'x');
  jsonGrid.render();
});

export function showPath(path, lock = false, pathLocked) {
  const display = document.getElementById('json-path-display');
  if (!display) return;
  if (pathLocked && !lock) return;
  display.textContent = path;
}

export function copyJSONPath() {
  const display = document.getElementById('json-path-display');
  if (!display) return;
  const pathText = display.textContent.trim();
  if (!pathText || pathText === 'Hover over a value to see its path') return;
  navigator.clipboard
    .writeText(pathText)
    .then(() => {
      console.log('Path copied:', pathText);
    })
    .catch((err) => {
      console.error('Could not copy text:', err);
    });
}

export function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-mode');
  const lightModeToggle = document.getElementById('light-mode-toggle');
  if (body.classList.contains('light-mode')) {
    editor.setTheme('ace/theme/github');
    lightModeToggle.textContent = 'dark';
    localStorage.setItem('theme', 'light-mode');
  } else {
    editor.setTheme('ace/theme/dracula');
    lightModeToggle.textContent = 'light';
    localStorage.setItem('theme', 'dark-mode');
  }
}

export function loadTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (!storedTheme) return;
  document.body.className = storedTheme;
  const lightModeToggle = document.getElementById('light-mode-toggle');
  if (storedTheme === 'light-mode') {
    editor.setTheme('ace/theme/github');
    lightModeToggle.textContent = 'dark';
  } else {
    editor.setTheme('ace/theme/dracula');
    lightModeToggle.textContent = 'light';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadTheme();
  const lightModeToggle = document.getElementById('light-mode-toggle');
  if (lightModeToggle) lightModeToggle.addEventListener('click', toggleTheme);
  const clearFn = document.getElementById('clearFn');
  if (clearFn) clearFn.addEventListener('click', clearEditor);
  const pasteFn = document.getElementById('pasteFn');
  if (pasteFn) pasteFn.addEventListener('click', paste);
  const formatFn = document.getElementById('formatFn');
  if (formatFn) formatFn.addEventListener('click', formatJSON);
  const copyPathFn = document.getElementById('copy-path-button');
  if (copyPathFn) copyPathFn.addEventListener('click', copyJSONPath);
});

const searchInput = document.getElementById('search-input');

export function removeHighlights() {
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(
        document.createTextNode(highlight.textContent),
        highlight
      );
      parent.normalize();
    }
  });
}

export function shrinkExpandedTables() {
  const expanders = document.querySelectorAll(
    `.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME} > .expander`
  );
  expanders.forEach((expander) => {
    const targetId = expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    const target = document.getElementById(targetId);
    if (target && !target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
      expander.click();
    }
  });
}

export function expandShrinkedTable(element) {
  const shrinkedTable = element.closest('.shrinked');
  if (shrinkedTable) {
    shrinkedTable.classList.remove('shrinked');
  }
}

export function traverseAndHighlight(element, query) {
  let matched = false;
  if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
    const textContent = element.textContent;
    const regex = new RegExp(`(${query})`, 'gi');
    const match = regex.exec(textContent);
    if (match) {
      const highlightedText = textContent.replace(
        regex,
        '<span class="highlight">$1</span>'
      );
      const tempElement = document.createElement('div');
      tempElement.innerHTML = highlightedText;
      while (tempElement.firstChild) {
        element.parentNode.insertBefore(tempElement.firstChild, element);
      }
      element.parentNode.removeChild(element);
      matched = true;
    }
  }
  if (element.nodeType === Node.ELEMENT_NODE) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      matched = traverseAndHighlight(child, query) || matched;
    }
  }
  return matched;
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export function performSearch() {
  removeHighlights();
  const query = searchInput.value.trim();
  if (!query) {
    shrinkExpandedTables();
    return;
  }
  const elements = document.querySelectorAll(
    '.json-grid-container td, .json-grid-container th, .json-grid-element-container'
  );
  elements.forEach((element) => {
    const foundMatch = traverseAndHighlight(element, query);
    if (foundMatch) {
      const expander = element
        .closest(`.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME}`)
        ?.querySelector('.expander');
      if (expander) {
        const targetId = expander.getAttribute(
          DOMHelper.EXPANDER_TARGET_ATTRIBUTE
        );
        const target = document.getElementById(targetId);
        if (target && target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
          expander.click();
        }
      }
    }
  });
}

const debouncedPerformSearch = debounce(performSearch, 500);
searchInput.addEventListener('input', debouncedPerformSearch);
