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

function convert(value: unknown, toCamel: boolean): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, toCamel));
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[convertKey(key, toCamel)] = convert(val, toCamel);
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
