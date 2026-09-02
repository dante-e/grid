import { describe, expect, it } from 'vitest';
import { JSONGrid } from '../../src/JSONGrid.js';
import { computePathChanges } from '../../src/diff.js';
import { toJSONPath, toJSONPointer } from '../../src/path.js';

describe('canonical paths', () => {
  it('formats special property names without ambiguity', () => {
    const segments = ['user.name', 'items[0]', 'a/b', '~key'];
    expect(toJSONPath(segments)).toBe('x["user.name"]["items[0]"]["a/b"]["~key"]');
    expect(toJSONPointer(segments)).toBe('/user.name/items[0]/a~1b/~0key');
  });

  it('updates literal keys containing path syntax', () => {
    const data = { 'user.name': { 'items[0]': 'before' }, user: { name: 'untouched' } };
    expect(JSONGrid.setValueAtPath(data, ['user.name', 'items[0]'], 'after')).toEqual({
      'user.name': { 'items[0]': 'after' },
      user: { name: 'untouched' },
    });
  });

  it('uses the same canonical identity for diffs', () => {
    const changes = computePathChanges({ 'a/b': 1 }, { 'a/b': 2 });
    expect(changes.modified).toEqual(new Set(['/a~1b']));
  });
});