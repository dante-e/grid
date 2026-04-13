// tests/unit/schema.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { inferSchema, summarizeSchema } from '../../src/schema.js';

// ─── inferSchema ─────────────────────────────────────────────────────────────

describe('inferSchema', () => {
  it('infers null for null input', () => {
    const s = inferSchema(null);
    expect(s.type).toBe('null');
    expect(s.$schema).toMatch(/draft-07/);
  });

  it('infers primitive types', () => {
    expect(inferSchema(42).type).toBe('number');
    expect(inferSchema('hello').type).toBe('string');
    expect(inferSchema(true).type).toBe('boolean');
  });

  it('infers a flat object', () => {
    const s = inferSchema({ name: 'Alice', age: 30, active: true });
    expect(s.type).toBe('object');
    expect(s.properties.name.type).toBe('string');
    expect(s.properties.age.type).toBe('number');
    expect(s.properties.active.type).toBe('boolean');
    expect(s.required).toContain('name');
  });

  it('marks null-valued keys as not required', () => {
    const s = inferSchema({ a: 1, b: null });
    expect(s.required).toContain('a');
    expect((s.required ?? []).includes('b')).toBe(false);
  });

  it('infers an array of uniform objects', () => {
    const s = inferSchema([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(s.type).toBe('array');
    expect(s.items.type).toBe('object');
    expect(s.items.properties.x.type).toBe('number');
  });

  it('marks a key absent from some array items as nullable', () => {
    const s = inferSchema([{ a: 1, b: 'hi' }, { a: 2 }]);
    const bSchema = s.items.properties.b;
    const isNullable = Array.isArray(bSchema.type)
      ? bSchema.type.includes('null')
      : bSchema.type === 'null';
    expect(isNullable).toBe(true);
    expect(s.items.required).not.toContain('b');
  });

  it('infers mixed-type arrays as a union type', () => {
    const s = inferSchema([1, 'two', true]);
    expect(Array.isArray(s.items.type)).toBe(true);
    expect(s.items.type).toContain('number');
    expect(s.items.type).toContain('string');
    expect(s.items.type).toContain('boolean');
  });

  it('infers nested objects recursively', () => {
    const s = inferSchema({ user: { id: 1, role: 'admin' } });
    expect(s.properties.user.type).toBe('object');
    expect(s.properties.user.properties.id.type).toBe('number');
    expect(s.properties.user.properties.role.type).toBe('string');
  });

  it('handles empty arrays', () => {
    const s = inferSchema([]);
    expect(s.type).toBe('array');
    expect(s.items).toBeDefined();
  });

  it('handles arrays of arrays', () => {
    const s = inferSchema([[1, 2], [3, 4]]);
    expect(s.type).toBe('array');
  });

  it('handles all-null array', () => {
    const s = inferSchema([null, null]);
    expect(s.type).toBe('array');
    expect(s.items.type).toBe('null');
  });
});

// ─── summarizeSchema ──────────────────────────────────────────────────────────

describe('summarizeSchema', () => {
  it('returns flat rows for a flat object', () => {
    const rows = summarizeSchema(inferSchema({ a: 1, b: 'x' }));
    expect(rows.map((r) => r.path)).toEqual(['a', 'b']);
    expect(rows[0].types).toEqual(['number']);
    expect(rows[1].types).toEqual(['string']);
    expect(rows[0].nullable).toBe(false);
  });

  it('marks nullable fields in rows', () => {
    const rows = summarizeSchema(inferSchema([{ a: 1 }, { a: 2, b: 'hi' }]));
    const bRow = rows.find((r) => r.path === '[].b');
    expect(bRow?.nullable).toBe(true);
    const aRow = rows.find((r) => r.path === '[].a');
    expect(aRow?.nullable).toBe(false);
  });

  it('uses depth to represent nesting', () => {
    const rows = summarizeSchema(inferSchema({ outer: { inner: 42 } }));
    const outerRow = rows.find((r) => r.path === 'outer');
    const innerRow = rows.find((r) => r.path === 'outer.inner');
    expect(outerRow?.depth).toBe(0);
    expect(innerRow?.depth).toBe(1);
  });

  it('returns an empty array for a primitive schema at root', () => {
    const rows = summarizeSchema(inferSchema(42));
    expect(rows).toEqual([]);
  });
});

