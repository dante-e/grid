/*****************
 * Initialize Ace Editor
 *****************/
var editor = ace.edit("editor");
editor.setTheme("ace/theme/dracula");
editor.session.setMode("ace/mode/json");

/**
 * Clear the Ace editor text
 */
function clearEditor() {
  editor.setValue("");
}

/**
 * Paste content from the clipboard into Ace
 */
function paste() {
  navigator.clipboard
    .readText()
    .then((clipboardText) => {
      editor.setValue(clipboardText);
      console.log("pasted");
    })
    .catch((err) => {
      console.error("Failed to read clipboard contents:", err);
    });
}

/**
 * Attempt to parse the current editor content as JSON
 * and reformat it with indentation
 */
function formatJSON() {
  try {
    const unformattedJSON = JSON.parse(editor.getValue());
    const formattedJSON = JSON.stringify(unformattedJSON, null, 2);
    editor.setValue(formattedJSON);
  } catch (error) {
    console.error("Error formatting JSON:", error);
    alert("Invalid JSON data. Please ensure your JSON data is valid before formatting.");
  }
}

// The main container where the JSON grid is rendered
const container = document.getElementById("container");

// On form submit, parse the editor's JSON and render it as a grid
const form = document.querySelector("form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = editor.getValue();
  JSONGrid.resetInstanceCounter();

  // Parse the text from Ace as JSON
  const parsed = JSON.parse(data);
  // Render
  const jsonGrid = new JSONGrid(parsed, container, "x");
  jsonGrid.render();
});

/*****************
 * Path Locking & Highlight
 *****************/

// Global variables to track the locked state
let pathLocked = false;
let lockedCell = null;

/**
 * Updates the #json-path-display text with the given path,
 * but only if not locked or if explicitly locking.
 * @param {string} path - The JSON path to display
 * @param {boolean} lock - If true, we override the pathLocked check
 */
function showPath(path, lock = false) {
  const display = document.getElementById("json-path-display");
  if (!display) return;

  // If a path is locked and we're not explicitly locking,
  // do NOT overwrite the display
  if (pathLocked && !lock) {
    return;
  }

  display.textContent = path;
}

/**
 * Copy the path from #json-path-display to the clipboard
 */
function copyJSONPath() {
  const display = document.getElementById("json-path-display");
  if (!display) return;

  const pathText = display.textContent.trim();
  if (!pathText || pathText === "Hover over a value to see its path") return;

  navigator.clipboard
    .writeText(pathText)
    .then(() => {
      console.log("Path copied:", pathText);
    })
    .catch((err) => {
      console.error("Could not copy text:", err);
    });
}

/*****************
 * Light/Dark Theme Toggle
 *****************/
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-mode");

  const lightModeToggle = document.getElementById("light-mode-toggle");
  if (body.classList.contains("light-mode")) {
    editor.setTheme("ace/theme/github");
    lightModeToggle.textContent = "dark";
    localStorage.setItem("theme", "light-mode");
  } else {
    editor.setTheme("ace/theme/dracula");
    lightModeToggle.textContent = "light";
    localStorage.setItem("theme", "dark-mode");
  }
}

function loadTheme() {
  const storedTheme = localStorage.getItem("theme");
  if (!storedTheme) return;

  document.body.className = storedTheme;
  const lightModeToggle = document.getElementById("light-mode-toggle");
  if (storedTheme === "light-mode") {
    editor.setTheme("ace/theme/github");
    lightModeToggle.textContent = "dark";
  } else {
    editor.setTheme("ace/theme/dracula");
    lightModeToggle.textContent = "light";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadTheme();
  const lightModeToggle = document.getElementById("light-mode-toggle");
  if (lightModeToggle) {
    lightModeToggle.addEventListener("click", toggleTheme);
  }
});

/*****************
 * Searching / Highlight
 *****************/
const searchInput = document.getElementById("search-input");

/**
 * Removes any existing highlight <span> from previous searches
 */
function removeHighlights() {
  const highlights = document.querySelectorAll(".highlight");
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    }
  });
}

/**
 * Collapses all expanded tables (useful if search is cleared)
 */
function shrinkExpandedTables() {
  const expanders = document.querySelectorAll(`.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME} > .expander`);
  expanders.forEach((expander) => {
    const targetId = expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
    const target = document.getElementById(targetId);
    if (target && !target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
      expander.click();
    }
  });
}

/**
 * Expands any collapsed table if needed for searching
 */
function expandShrinkedTable(element) {
  const shrinkedTable = element.closest(".shrinked");
  if (shrinkedTable) {
    shrinkedTable.classList.remove("shrinked");
  }
}

/**
 * Recursively walks the DOM inside `element` to find and highlight text matching `query`
 * @param {Node} element - DOM node to search within
 * @param {string} query - the search term
 * @returns {boolean} Whether we found at least one match
 */
function traverseAndHighlight(element, query) {
  let matched = false;

  // If it's a text node, do a regex search
  if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
    const textContent = element.textContent;
    const regex = new RegExp(`(${query})`, "gi");
    const match = regex.exec(textContent);

    if (match) {
      const highlightedText = textContent.replace(regex, `<span class="highlight">$1</span>`);
      const tempElement = document.createElement("div");
      tempElement.innerHTML = highlightedText;

      while (tempElement.firstChild) {
        element.parentNode.insertBefore(tempElement.firstChild, element);
      }
      element.parentNode.removeChild(element);
      matched = true;
    }
  }

  // If it's an element node, recurse into children
  if (element.nodeType === Node.ELEMENT_NODE) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      matched = traverseAndHighlight(child, query) || matched;
    }
  }

  return matched;
}

/**
 * A small "debounce" utility: wait `wait` ms after the last call
 * before actually running `func`
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function performSearch() {
  removeHighlights();
  const query = searchInput.value.trim();
  if (!query) {
    shrinkExpandedTables();
    return;
  }

  const elements = document.querySelectorAll(
    ".json-grid-container td, .json-grid-container th, .json-grid-element-container"
  );

  elements.forEach((element) => {
    const foundMatch = traverseAndHighlight(element, query);
    if (foundMatch) {
      const expander = element
        .closest(`.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME}`)
        ?.querySelector(".expander");
      if (expander) {
        const targetId = expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
        const target = document.getElementById(targetId);
        if (target && target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
          expander.click();
        }
      }
    }
  });
}

const debouncedPerformSearch = debounce(performSearch, 500);
searchInput.addEventListener("input", debouncedPerformSearch);
