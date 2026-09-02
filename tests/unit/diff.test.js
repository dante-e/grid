import { describe, expect, it } from 'vitest';
import { applyDiffToGrid, buildDiffDisplayData, computePathChanges } from '../../src/diff.js';
import { JSONGrid } from '../../src/JSONGrid.js';

describe('diff display', () => {
  it('retains removed values without replacing right-side values', () => {
    const left = { kept: 'before', removed: { label: 'visible' }, list: [1, 2] };
    const right = { kept: 'after', list: [1] };

    expect(buildDiffDisplayData(left, right)).toEqual({
      kept: 'after',
      removed: { label: 'visible' },
      list: [1, 2],
    });
  });

  it('renders and annotates removed leaves', () => {
    const left = { removed: { label: 'visible' } };
    const right = {};
    const container = document.createElement('div');
    new JSONGrid(buildDiffDisplayData(left, right), container).render();

    applyDiffToGrid(container, computePathChanges(left, right));

    const removed = container.querySelector('[data-json-pointer="/removed/label"]');
    expect(removed.textContent).toBe('visible');
    expect(removed.classList.contains('diff-removed')).toBe(true);
  });
});