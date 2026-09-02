export function toJSONPointer(segments) {
  if (segments.length === 0) return '';
  return `/${segments.map((segment) => String(segment).replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
}

export function toJSONPath(segments) {
  return segments.reduce((path, segment) => {
    if (typeof segment === 'number') return `${path}[${segment}]`;
    if (/^[A-Za-z_$][\w$]*$/.test(segment)) return `${path}.${segment}`;
    return `${path}[${JSON.stringify(segment)}]`;
  }, 'x');
}