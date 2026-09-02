import { beforeEach, describe, expect, it } from 'vitest';
import { DOMHelper } from '../../src/DOMHelper.js';
import { JSONGrid } from '../../src/JSONGrid.js';

describe('JSONGrid', () => {
  beforeEach(() => JSONGrid.resetInstanceCounter());

  it('renders object and array values with canonical paths', () => {
    const container = document.createElement('div');
    new JSONGrid({ users: [{ 'display.name': 'Ada' }] }, container).render();

    const value = container.querySelector('[data-json-pointer="/users/0/display.name"]');
    expect(value.textContent).toBe('Ada');
    expect(value.dataset.jsonPath).toBe('x.users[0]["display.name"]');
  });

  it('renders primitive roots', () => {
    const container = document.createElement('div');
    new JSONGrid(false, container).render();

    expect(container.querySelector('[data-json-pointer=""]')?.textContent).toBe('false');
  });

  it.each([
    ['null', 'string', null],
    ['true', 'string', true],
    ['42', 'number', 42],
    ['plain text', 'string', 'plain text'],
  ])('parses %s using a %s hint', (raw, hint, expected) => {
    expect(JSONGrid.parseTypedValue(raw, hint)).toBe(expected);
  });

  it('toggles nested tables through their expander', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new JSONGrid({ nested: { value: 1 } }, container).render();
    const expander = container.querySelector('.expander');
    const target = document.getElementById(
      expander.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE)
    );

    expect(target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)).toBe(true);
    expander.click();
    expect(target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)).toBe(false);
    expect(expander.querySelector('.expander-toggle').textContent).toBe('[-]');
    container.remove();
  });
});