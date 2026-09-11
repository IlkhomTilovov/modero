// Converts between the backend's camelCase API payloads and the snake_case
// shapes this codebase's admin pages/hooks were originally written against
// (matching the old Supabase/PostgREST column-name convention).

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

function convertKey(key: string, toCamel: boolean): string {
  if (toCamel) return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Free-form JSON blobs keyed by language/theme-setting code (e.g.
// `translations: { uz: { metaTitle: "..." } }`, `colorPalette`) must not have
// their inner keys walked — a language code like "uz" isn't a case-style
// issue, but a nested field like "metaTitle" would get mangled into
// "meta_title" on the way out and never match back up on the way in.
const OPAQUE_JSON_KEYS = new Set(['translations']);

function convert(value: unknown, toCamel: boolean): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, toCamel));
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const convertedKey = convertKey(key, toCamel);
      result[convertedKey] = OPAQUE_JSON_KEYS.has(convertedKey) ? val : convert(val, toCamel);
    }
    return result;
  }
  return value;
}

export function toCamelCase<T = any>(value: unknown): T {
  return convert(value, true) as T;
}

export function toSnakeCase<T = any>(value: unknown): T {
  return convert(value, false) as T;
}
