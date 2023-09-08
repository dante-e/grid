# GRID

[jsongrid.dev](https://www.jsongrid.dev/)

## Overview
JSONGrid is a web-based tool that allows you to convert JSON data into a readable grid format for easier visualization. This project provides a simple HTML interface where you can input JSON data, and it will generate a tabular representation of the data, making it easier to analyze and understand complex JSON structures.

## Usage
**Input JSON Data:** Enter your JSON data into the text editor provided on the web page. You can either manually type the JSON data or use the "paste" button to paste data from your clipboard.

**Format JSON Data:** If your JSON data is not well-formatted, you can click the "format" button to automatically format it for better readability.

**Convert to Grid:** Click the "grid" button to convert the JSON data into a grid format.

**Search:** Use the search input field to search for specific values within the grid. As you type, the tool will highlight matching values in the grid.

**Toggle Light/Dark Mode:** You can switch between light and dark modes for a comfortable viewing experience by clicking the "light" or "dark" button.

**Clear Editor:** Click the "clear" button to clear the text editor and start with a new JSON input.

## Example JSON
Here's an example JSON data structure that you can use to test the tool:

```json
{
  "squadName": "Super hero squad",
  "homeTown": "Metro City",
  "formed": 2016,
  "secretBase": "Super tower",
  "active": true,
  "members": [
    {
      "index": 0,
      "isActive": false,
      "age": 21,
      "eyeColor": "blue",
      "name": "Bentley Clayton",
      "gender": "male",
      "registered": "2018-05-02T05:35:41 +04:00"
    },
    {
      "index": 1,
      "isActive": false,
      "age": 23,
      "eyeColor": "blue",
      "name": "Lela Ramos",
      "gender": "female",
      "registered": "2014-02-24T03:13:50 +05:00"
    },
    // ... (more members)
  ]
}
```

## Credits
This tool is created and maintained by dante e. 
Based on the library created by [Igor Araujo.](https://github.com/araujoigor/json-grid)

Thank you for using JSONGrid! I hope it helps you work with JSON data more efficiently.
