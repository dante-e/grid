import { XMLBuilder } from 'fast-xml-parser';

// ─── JSON ──────────────────────────────────────────────────────────────────────
export function downloadJSON(data) {
  _trigger(JSON.stringify(data, null, 2), 'data.json', 'application/json');
}

// ─── CSV ───────────────────────────────────────────────────────────────────────
export function downloadCSV(data) {
  _trigger(_toCSV(data), 'data.csv', 'text/csv;charset=utf-8;');
}

function _toCSV(data) {
  // Array of objects → proper table
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const headers = _extractHeaders(data);
    const headerRow = headers.map(_esc).join(',');
    const dataRows = data.map((row) => {
      if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
        return headers.map((h) => _esc(_str(row[h]))).join(',');
      }
      return _esc(_str(row));
    });
    return [headerRow, ...dataRows].join('\n');
  }

  // Flat object → key, value
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const rows = Object.entries(data).map(([k, v]) => `${_esc(k)},${_esc(_str(v))}`);
    return ['key,value', ...rows].join('\n');
  }

  return _str(data);
}

function _extractHeaders(arr) {
  const keys = [];
  arr.forEach((item) => {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach((k) => { if (!keys.includes(k)) keys.push(k); });
    }
  });
  return keys;
}

function _esc(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function _str(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ─── XML ───────────────────────────────────────────────────────────────────────
export function downloadXML(data) {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  });
  _trigger(builder.build(data), 'data.xml', 'application/xml');
}

// ─── Clipboard ────────────────────────────────────────────────────────────────
export async function copyJSONToClipboard(data) {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _trigger(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
