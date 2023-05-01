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


