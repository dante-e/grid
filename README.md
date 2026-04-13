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
