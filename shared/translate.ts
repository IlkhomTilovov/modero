// Reads a field out of a catalog row's dynamic `translations` JSON blob
// (shape: `{ [languageCode]: { [field]: string } }`), falling back to the
// legacy nameUz/nameRu-style column when a language has no translation yet
// (e.g. rows saved before a language was added, or a language that was
// added but not yet filled in for this row).
export function getTranslated(
  translations: unknown,
  lang: string,
  field: string,
  fallback: string
): string {
  if (translations && typeof translations === 'object') {
    const forLang = (translations as Record<string, unknown>)[lang];
    if (forLang && typeof forLang === 'object') {
      const value = (forLang as Record<string, unknown>)[field];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return fallback;
}

// Admin-form helpers for records with several localized fields (e.g. a
// Product's name/description/metaTitle/metaDescription). The DB stores
// `translations` grouped by language first ({ uz: { name, metaTitle } }),
// but a form with one LocalizedField per field is easiest to wire against a
// value grouped by field first ({ name: { uz, ru }, metaTitle: { uz, ru } }).

export function pivotToFieldFirst(
  translations: unknown,
  fields: string[]
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const f of fields) result[f] = {};
  if (translations && typeof translations === 'object') {
    for (const [lang, byField] of Object.entries(translations as Record<string, unknown>)) {
      if (!byField || typeof byField !== 'object') continue;
      for (const f of fields) {
        const value = (byField as Record<string, unknown>)[f];
        if (typeof value === 'string') result[f][lang] = value;
      }
    }
  }
  return result;
}

export function pivotToLangFirst(
  byField: Record<string, Record<string, string>>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [field, byLang] of Object.entries(byField)) {
    for (const [lang, value] of Object.entries(byLang ?? {})) {
      if (!value?.trim()) continue;
      result[lang] = result[lang] || {};
      result[lang][field] = value.trim();
    }
  }
  return result;
}
