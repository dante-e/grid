# JSON Grid

**[jsongrid.dev](https://www.jsongrid.dev/)**

A fast, browser-based tool for visualising, editing and comparing JSON and XML as an interactive grid. No sign-up, no backend, everything runs locally.

---

## Features

- **JSON & XML support** — paste either format and the editor auto-detects it
- **Interactive grid** — nested objects and arrays render as collapsible tables
- **Inline editing** — click any value in the grid to edit it in place
- **Diff / compare** — side-by-side diff with added / removed / modified highlights and jump-to-change navigation
- **Full-text search** — highlights matches across the grid with ↑ ↓ navigation
- **Export** — download as JSON, CSV, or XML, or copy to clipboard
- **Share** — one click copies a compressed URL that restores the full grid
- **Dark & light theme**

---

## Usage

#### Input
- Type or paste JSON / XML directly into the editor
- Click **paste** to pull from clipboard
- Drag and drop a `.json` or `.xml` file onto the editor panel

#### Render
- Click **grid** or press `Ctrl+Enter` (`Cmd+Enter` on Mac)

#### Format
- Click **format** to pretty-print the current JSON or XML in the editor

#### Navigate the grid
- Click `[+]` / `[-]` to expand or collapse nested nodes
- Hover any cell to see its path in the bar at the bottom
- Click a cell to lock the path, click again to unlock
- Click **copy path** to copy it to clipboard

#### Search
- Type in the search bar — matches highlight live across the grid
- Use `↑` / `↓` buttons or `Enter` / `Shift+Enter` to jump between matches

#### Diff
- Click **diff** to enter split-editor mode
- Paste the two versions you want to compare (JSON or XML, independently)
- Click **run diff** or press `Ctrl+Enter`
- Changed nodes are highlighted and expanded automatically
- Use `↑` / `↓` in the legend bar to jump between changes

#### Export
- Click **export** and choose JSON, CSV, XML, or Copy to clipboard

#### Share
- Click **share** to copy a URL that encodes the current data — anyone with the link sees the same grid

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` / `Cmd+Enter` | Render grid (or run diff in diff mode) |
| `Enter` in search | Next match |
| `Shift+Enter` in search | Previous match |
| `Escape` in search | Clear search |
| `Enter` in cell | Confirm inline edit |
| `Escape` in cell | Cancel inline edit |

---

## Credits

Built and maintained by [dante e.](https://github.com/dante-e)  
Originally inspired by [Igor Araujo's json-grid](https://github.com/araujoigor/json-grid)


#### Input JSON Data
Manual Entry: Type or paste your JSON data directly into the Ace editor on the web page.
Clipboard Paste: Click the "Paste" button to insert JSON data from your clipboard effortlessly.

#### Format JSON Data
If your JSON data isn't well-formatted, click the "Format" button to automatically format it with proper indentation and structure.

#### Convert to Grid
Once your JSON data is ready, click the "Grid" button to transform it into an interactive grid format.

#### Navigate the Grid
Expand/Collapse: Click on the [+] or [-] icons to expand or collapse nested JSON objects or arrays.
Hover for Path: Hover over any cell to view its JSON path in the path panel at the bottom.

#### Search Functionality
Use the search bar to find specific values within your JSON data. Matching values will be highlighted dynamically as you type.

#### Light/Dark Mode
Toggle between light and dark themes using the "Light/Dark" button to suit your visual preference and environment.

#### Clipboard Operations
Copy Path: Click the "Copy Path" button in the path panel to copy the JSON path of the selected cell to your clipboard.

#### Clear Editor
Click the "Clear" button to erase all content from the editor and start fresh with new JSON data.

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
    {
      "index": 2,
      "isActive": true,
      "age": 38,
      "eyeColor": "green",
      "name": "Milagros Becker",
      "gender": "female",
      "registered": "2016-10-22T12:18:50 +04:00"
    },
    {
      "index": 3,
      "isActive": false,
      "age": 30,
      "eyeColor": "brown",
      "name": "Mccoy Barrera",
      "gender": "male",
      "registered": "2016-12-03T03:44:57 +05:00"
    },
    {
      "index": 4,
      "isActive": false,
      "age": 35,
      "eyeColor": "brown",
      "name": "Morton Bennett",
      "gender": "male",
      "registered": "2015-10-06T09:48:03 +04:00"
    },
    {
      "index": 5,
      "isActive": true,
      "age": 20,
      "eyeColor": "blue",
      "name": "Acosta Bird",
      "gender": "male",
      "registered": "2019-02-11T09:59:58 +05:00"
    },
    {
      "index": 6,
      "isActive": false,
      "age": 35,
      "eyeColor": "blue",
      "name": "Mcleod Keith",
      "gender": "male",
      "registered": "2014-04-24T07:50:11 +04:00"
    },
    {
      "index": 7,
      "isActive": false,
      "age": 27,
      "eyeColor": "brown",
      "name": "Magdalena Burgess",
      "gender": "female",
      "registered": "2015-03-19T09:28:55 +04:00"
    },
    {
      "index": 8,
      "isActive": false,
      "age": 37,
      "eyeColor": "blue",
      "name": "Cline Castaneda",
      "gender": "male",
      "registered": "2016-02-29T09:49:37 +05:00"
    },
    {
      "index": 9,
      "isActive": false,
      "age": 39,
      "eyeColor": "green",
      "name": "Garcia Baker",
      "gender": "male",
      "registered": "2018-05-26T02:54:22 +04:00"
    },
    {
      "index": 10,
      "isActive": true,
      "age": 40,
      "eyeColor": "blue",
      "name": "Lenora Keller",
      "gender": "female",
      "registered": "2017-12-19T05:12:17 +05:00"
    },
    {
      "index": 11,
      "isActive": false,
      "age": 33,
      "eyeColor": "green",
      "name": "Kathryn Donovan",
      "gender": "female",
      "registered": "2014-03-21T12:33:36 +04:00"
    },
    {
      "index": 12,
      "isActive": true,
      "age": 40,
      "eyeColor": "blue",
      "name": "Opal Hinton",
      "gender": "female",
      "registered": "2014-05-03T02:14:25 +04:00"
    },
    {
      "index": 13,
      "isActive": false,
      "age": 25,
      "eyeColor": "green",
      "name": "Mayer Gray",
      "gender": "male",
      "registered": "2016-04-01T05:52:21 +04:00"
    },
    {
      "index": 14,
      "isActive": true,
      "age": 22,
      "eyeColor": "green",
      "name": "Josefina Quinn",
      "gender": "female",
      "registered": "2015-02-07T12:04:14 +05:00"
    }
  ]
}
```

## Credits
This tool is created and maintained by dante e. 
Based on the library created by [Igor Araujo.](https://github.com/araujoigor/json-grid)

Thank you for using Grid! I hope it helps you work with JSON data more efficiently.
