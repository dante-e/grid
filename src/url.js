import LZString from 'lz-string';

const HASH_KEY = 'j';

/** Encode JSON string into a shareable URL. */
export function encodeToURL(jsonStr) {
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  const url = new URL(window.location.href);
  url.hash = `${HASH_KEY}=${compressed}`;
  return url.toString();
}

/** Persist JSON to URL hash without navigation. */
export function saveToURL(jsonStr) {
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  const url = new URL(window.location.href);
  url.hash = `${HASH_KEY}=${compressed}`;
  history.replaceState(null, '', url.toString());
}

/** Read JSON from URL hash. Returns null if absent or corrupt. */
export function loadFromURL() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const compressed = params.get(HASH_KEY);
  if (!compressed) return null;
  return LZString.decompressFromEncodedURIComponent(compressed);
}

/** Copy the shareable URL to clipboard. */
export async function copyShareURL(jsonStr) {
  const url = encodeToURL(jsonStr);
  await navigator.clipboard.writeText(url);
}

/** Strip the JSON hash from the URL. */
export function clearURL() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
