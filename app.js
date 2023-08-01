var editor = ace.edit("editor");
editor.setTheme("ace/theme/dracula");
editor.session.setMode("ace/mode/json");

function clearEditor() {
      editor.setValue("");
}

function paste() {
  // Use the Clipboard API to get the clipboard data
  navigator.clipboard.readText()
    .then(clipboardText => {
      // The clipboardText variable now contains the pasted content
      // You can then set it to the target element (e.g., textarea)
      editor.setValue("" + clipboardText);
      console.log("pasted");
    })
    .catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });
}


function formatJSON() {
    try {
      var unformattedJSON = JSON.parse(editor.getValue());
      var formattedJSON = JSON.stringify(unformattedJSON, null, 2);
      editor.setValue(formattedJSON);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      alert('Invalid JSON data. Please ensure your JSON data is valid before formatting.');
    }
  }
var container = document.getElementById("container");
const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  var data = editor.getValue();
  JSONGrid.resetInstanceCounter();
  var jsonGrid = new JSONGrid(JSON.parse(data), container);
  jsonGrid.render();
});

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-mode");

  // Update the button text and Ace editor theme depending on the current mode
  if (body.classList.contains("light-mode")) {
    editor.setTheme("ace/theme/github");
    lightModeToggle.textContent = "dark";

    // Store the theme preference in localStorage
    localStorage.setItem("theme", "light-mode");
  } else {
    editor.setTheme("ace/theme/dracula");
    lightModeToggle.textContent = "light";

    // Store the theme preference in localStorage
    localStorage.setItem("theme", "dark-mode");
  }
}

function loadTheme() {
  const storedTheme = localStorage.getItem("theme");

  if (storedTheme) {
    document.body.className = storedTheme;

    if (storedTheme === "light-mode") {
      editor.setTheme("ace/theme/github");
      lightModeToggle.textContent = "dark";
    } else {
      editor.setTheme("ace/theme/dracula");
      lightModeToggle.textContent = "light";
    }
  }
}

// Get the light mode toggle button element
const lightModeToggle = document.getElementById('light-mode-toggle');

lightModeToggle.addEventListener('click', toggleTheme);

document.addEventListener("DOMContentLoaded", function() {
  loadTheme();
});

const searchInput = document.getElementById('search-input');

function removeHighlights() {
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
}

function expandShrinkedTable(element) {
  const shrinkedTable = element.closest('.shrinked');
  if (shrinkedTable) {
    shrinkedTable.classList.remove('shrinked');
  }
}

function shrinkExpandedTables() {
  const expanders = document.querySelectorAll(`.${DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME} > .expander`);
  expanders.forEach(expander => {
    const target = document.getElementById(expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE));
    if (target && !target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
      expander.click();
    }
  });
}

function traverseAndHighlight(element, query) {
  let matched = false;

  if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
    const textContent = element.textContent;
    const regex = new RegExp(`(${query})`, 'gi');
    const match = regex.exec(textContent);

    if (match) {
      const highlightedText = textContent.replace(regex, '<span class="highlight">$1</span>');
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

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Perform search with debouncing
const debouncedPerformSearch = debounce(performSearch, 1000);
searchInput.addEventListener('input', debouncedPerformSearch);

// Lightweight search function
let searchAnimationFrame;

function performSearch(event) {
  const rows = document.querySelectorAll('.json-grid-container tbody tr');

  // Cancel the previous search animation frame if it exists
  if (searchAnimationFrame) {
    cancelAnimationFrame(searchAnimationFrame);
  }

  // Schedule a new search animation frame
  searchAnimationFrame = requestAnimationFrame(() => {
    removeHighlights();

    const query = searchInput.value.trim();

    if (!query) {
      shrinkExpandedTables(); // Call the function if the query is empty
      return;
    }
  
    const elements = Array.from(document.querySelectorAll('.json-grid-container td, .json-grid-container th, .json-grid-container .json-grid-element-container'));
    elements.forEach(element => {
      let matched = false;
      if (element.tagName === 'TD' || element.tagName === 'TH') {
        matched = traverseAndHighlight(element, query);
      } else if (element.classList.contains('json-grid-element-container')) {
        matched = traverseAndHighlight(element, query);
      }

      if (matched) {
        const expander = element.closest('.json-grid-element-container').querySelector('.expander');
        if (expander) {
          const target = document.getElementById(expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE));
          if (target && target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)) {
            expander.click();
          }
        }
      }
    });
  });
}



















