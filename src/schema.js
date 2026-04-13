/**
 * schema.js — pure schema-inference utilities.
 * No DOM dependencies, no global state.
 *
 * Exports:
 *   inferSchema(data)       → JSON Schema draft-07 object
 *   summarizeSchema(schema) → Array<{ path, depth, types, nullable }>
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _inferNode(value) {
  if (value === null || value === undefined) return { type: 'null' };
  if (Array.isArray(value)) return _inferArray(value);
  if (typeof value === 'object') return _inferObject(value);
  return { type: typeof value };
}

function _inferObject(obj) {
  const schema = { type: 'object', properties: {} };
  const required = [];
  for (const [key, val] of Object.entries(obj)) {
    schema.properties[key] = _inferNode(val);
    if (val !== null && val !== undefined) required.push(key);
  }
  if (required.length > 0) schema.required = required;
  return schema;
}

function _inferArray(arr) {
  if (arr.length === 0) return { type: 'array', items: {} };
  return { type: 'array', items: _mergeSchemas(arr.map(_inferNode)) };
}

/**
 * Merge schemas produced from items of the same array.
 *
 * When all items are objects, union their property sets and mark keys
 * that are absent from some items as nullable.
 * For mixed primitive types, collapses to { type: [typeA, typeB, …] }.
 */
function _mergeSchemas(schemas) {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  const types = [
    ...new Set(schemas.flatMap((s) => (Array.isArray(s.type) ? s.type : [s.type]))),
  ];

  if (types.length === 1 && types[0] === 'object') {
    const merged = { type: 'object', properties: {} };
    const required = [];
    const allKeys = new Set(
      schemas.flatMap((s) => (s.properties ? Object.keys(s.properties) : []))
    );

    allKeys.forEach((key) => {
      const presentIn = schemas.filter((s) => s.properties && key in s.properties);
      const propSchemas = presentIn.map((s) => s.properties[key]);
      const nullable = presentIn.length < schemas.length;
      let propSchema =
        propSchemas.length > 1 ? _mergeSchemas(propSchemas) : propSchemas[0] ?? { type: 'null' };
      if (nullable) propSchema = _addNull(propSchema);
      merged.properties[key] = propSchema;
      if (!nullable) required.push(key);
    });

    if (required.length > 0) merged.required = required;
    return merged;
  }

  // All schemas share one non-object type — return representative schema as-is.
  // Produces a clean scalar type string instead of a single-element array.
  const filtered = types.filter(Boolean);
  if (filtered.length === 1) return schemas[0];

  // Mixed types — collapse to a union type array
  return { type: filtered };
}

/** Ensure 'null' is included in the schema's type field. */
function _addNull(schema) {
  if (Array.isArray(schema.type)) {
    return schema.type.includes('null') ? schema : { ...schema, type: [...schema.type, 'null'] };
  }
  if (schema.type === 'null') return schema;
  return { ...schema, type: [schema.type, 'null'] };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Infer a JSON Schema draft-07 descriptor from any JS value.
 *
 * @param   {*}      data  Any JSON-compatible value.
 * @returns {object}       JSON Schema draft-07 object.
 */
export function inferSchema(data) {
  const schema = _inferNode(data);
  schema.$schema = 'http://json-schema.org/draft-07/schema#';
  return schema;
}

/**
 * Flatten a JSON Schema into a display-ready row list for the sidebar table.
 *
 * @param   {object} schema  Output of inferSchema (or any sub-schema).
 * @param   {string} [path]  Dot-path prefix used by recursion; omit on first call.
 * @param   {number} [depth] Nesting depth for indentation; omit on first call.
 * @returns {Array<{ path: string, depth: number, types: string[], nullable: boolean }>}
 */
export function summarizeSchema(schema, path = '', depth = 0) {
  const rows = [];

  if (schema.type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const fullPath = path ? `${path}.${key}` : key;
      const { types, nullable } = _extractTypes(propSchema);
      rows.push({ path: fullPath, depth, types, nullable });
      const base = _stripNull(propSchema);
      if (base.type === 'object' && base.properties) {
        rows.push(...summarizeSchema(base, fullPath, depth + 1));
      } else if (base.type === 'array' && base.items) {
        const itemBase = _stripNull(base.items);
        if (itemBase.type === 'object' && itemBase.properties) {
          rows.push(...summarizeSchema(itemBase, `${fullPath}[]`, depth + 1));
        }
      }
    }
  } else if (schema.type === 'array' && schema.items) {
    const { types, nullable } = _extractTypes(schema.items);
    const arrPath = path ? `${path}[]` : '[]';
    rows.push({ path: arrPath, depth, types, nullable });
    const itemBase = _stripNull(schema.items);
    if (itemBase.type === 'object' && itemBase.properties) {
      rows.push(...summarizeSchema(itemBase, arrPath, depth + 1));
    }
  } else if (path) {
    const { types, nullable } = _extractTypes(schema);
    rows.push({ path, depth, types, nullable });
  }

  return rows;
}

function _extractTypes(schema) {
  if (Array.isArray(schema.type)) {
    const nonNull = schema.type.filter((t) => t !== 'null');
    return { types: nonNull, nullable: schema.type.includes('null') };
  }
  if (schema.type === 'null') return { types: [], nullable: true };
  return { types: schema.type ? [schema.type] : [], nullable: false };
}

function _stripNull(schema) {
  if (!Array.isArray(schema.type)) return schema;
  const nonNull = schema.type.filter((t) => t !== 'null');
  if (nonNull.length === 1) return { ...schema, type: nonNull[0] };
  return { ...schema, type: nonNull };
}
