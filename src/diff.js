/**
 * Recursively compare two JSON values and return sets of changed paths.
 * Paths match the JSONGrid format: `x`, `x.key`, `x[0].key`, etc.
 *
 * @param {*} left
 * @param {*} right
 * @param {string} [path]
 * @returns {{ added: Set<string>, removed: Set<string>, modified: Set<string> }}
 */
export function computePathChanges(left, right, path = 'x') {
  const changes = { added: new Set(), removed: new Set(), modified: new Set() };
  _diffValues(left, right, path, changes);
  return changes;
}

function _diffValues(left, right, path, changes) {
  // Both plain objects
  if (_isObj(left) && _isObj(right)) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    allKeys.forEach((key) => {
      const childPath = `${path}.${key}`;
      if (!(key in left))       _markAdded(right[key], childPath, changes);
      else if (!(key in right)) _markRemoved(left[key], childPath, changes);
      else                      _diffValues(left[key], right[key], childPath, changes);
    });
    return;
  }

  // Both arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= left.length)   _markAdded(right[i], childPath, changes);
      else if (i >= right.length) _markRemoved(left[i], childPath, changes);
      else _diffValues(left[i], right[i], childPath, changes);
    }
    return;
  }

  // Primitives or type mismatch
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    changes.modified.add(path);
  }
}

function _markAdded(value, path, changes) {
  changes.added.add(path);
  if (_isObj(value))          Object.keys(value).forEach((k) => _markAdded(value[k], `${path}.${k}`, changes));
  else if (Array.isArray(value)) value.forEach((v, i) => _markAdded(v, `${path}[${i}]`, changes));
}

function _markRemoved(value, path, changes) {
  changes.removed.add(path);
  if (_isObj(value))          Object.keys(value).forEach((k) => _markRemoved(value[k], `${path}.${k}`, changes));
  else if (Array.isArray(value)) value.forEach((v, i) => _markRemoved(v, `${path}[${i}]`, changes));
}

function _isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// ─── DOM annotation ───────────────────────────────────────────────────────────

export function applyDiffToGrid(container, changes) {
  clearDiffHighlights(container);
  container.querySelectorAll('[data-json-path]').forEach((span) => {
    const path = span.getAttribute('data-json-path');
    let cls = null;
    if      (changes.added.has(path))    cls = 'diff-added';
    else if (changes.removed.has(path))  cls = 'diff-removed';
    else if (changes.modified.has(path)) cls = 'diff-modified';
    if (cls) {
      span.classList.add(cls);
      const td = span.closest('td');
      if (td) td.classList.add(cls);
    }
  });
}

export function clearDiffHighlights(container) {
  container
    .querySelectorAll('.diff-added, .diff-removed, .diff-modified')
    .forEach((el) => el.classList.remove('diff-added', 'diff-removed', 'diff-modified'));
}
