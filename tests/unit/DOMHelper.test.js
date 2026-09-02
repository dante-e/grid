import { describe, expect, it } from 'vitest';
import { DOMHelper } from '../../src/DOMHelper.js';

describe('DOMHelper.createExpander', () => {
  it('renders untrusted titles as text', () => {
    const table = document.createElement('table');
    table.id = 'nested-table';
    const title = '<img src=x onerror="globalThis.injected=true">';

    const expander = DOMHelper.createExpander(title, 1, table, true);

    expect(expander.querySelector('.expander-title').textContent).toBe(title);
    expect(expander.querySelector('img')).toBeNull();
  });
});