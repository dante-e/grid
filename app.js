var editor = ace.edit("editor");
editor.setTheme("ace/theme/dracula");
editor.session.setMode("ace/mode/json");
function clearEditor() {
      editor.setValue("");
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
  var jsonGrid = new JSONGrid(JSON.parse(data), container);
  jsonGrid.render();
});

// Get the light mode toggle button element
const lightModeToggle = document.getElementById('light-mode-toggle');

// Add an event listener to handle the click event
lightModeToggle.addEventListener('click', () => {
  // Toggle the "light-mode" class on the body element
  document.body.classList.toggle('light-mode');
  
  // Update the button text depending on the current mode
  if (document.body.classList.contains('light-mode')) {
    editor.setTheme("ace/theme/github");
    lightModeToggle.textContent = 'dark';
  } else {
    editor.setTheme("ace/theme/dracula");
    lightModeToggle.textContent = 'light';
  }
});

const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', performSearch);

function removeHighlights() {
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
}

function traverseAndHighlight(element, query) {
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
      return;
    }
  }

  if (element.nodeType === Node.ELEMENT_NODE) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      traverseAndHighlight(child, query);
    }
  }
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
const debouncedPerformSearch = debounce(performSearch, 200);
searchInput.addEventListener('input', debouncedPerformSearch);

// Lightweight search function
let searchAnimationFrame;

function performSearch(event) {
  const query = event.target.value;
  const rows = document.querySelectorAll('.json-grid-container tbody tr');

  // Cancel the previous search animation frame if it exists
  if (searchAnimationFrame) {
    cancelAnimationFrame(searchAnimationFrame);
  }

  // Schedule a new search animation frame
  searchAnimationFrame = requestAnimationFrame(() => {
    removeHighlights();

    if (!query) {
      return;
    }

    rows.forEach(row => {
      const elements = row.querySelectorAll('td, th, .json-grid-element-container');
      elements.forEach(element => {
        if (!element.closest('.shrinked')) {
          if (element.tagName === 'TD' || element.tagName === 'TH') {
            traverseAndHighlight(element, query);
          } else if (element.classList.contains('json-grid-element-container')) {
            traverseAndHighlight(element, query);
          }
        }
      });
    });
  });
}



















