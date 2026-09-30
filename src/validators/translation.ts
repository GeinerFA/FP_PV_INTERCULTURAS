import { translationTargetLocales, type TranslationTargetLocale } from "@/config/i18n";
import { translationSources, type TranslationMeta, type TranslationSource } from "@/lib/translation/types";

function normalizeDateLike(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}

/** Lenient: returns null for anything that is not a complete meta entry (e.g. legacy documents). */
export function parseTranslationMeta(value: unknown): TranslationMeta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const object = value as Record<string, unknown>;
  const source = object.source;
  const sourceHash = typeof object.sourceHash === "string" ? object.sourceHash.trim() : "";

  if (typeof source !== "string" || !translationSources.includes(source as TranslationSource) || !sourceHash) {
    return null;
  }

  return {
    source: source as TranslationSource,
    sourceHash,
    translatedAt: normalizeDateLike(object.translatedAt),
  };
}

export type StoredShortTextTranslation<K extends string> = {
  content: Record<K, string>;
  meta: TranslationMeta;
};

/** Parses the flat stored shape `{ ...fields, source, sourceHash, translatedAt }` per target locale. */
export function parseShortTextTranslations<K extends string>(
  value: unknown,
  fields: readonly K[],
): Partial<Record<TranslationTargetLocale, StoredShortTextTranslation<K>>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const object = value as Record<string, unknown>;
  const entries = translationTargetLocales.flatMap((locale) => {
    const stored = object[locale];
    const meta = parseTranslationMeta(stored);

    if (!meta || !stored || typeof stored !== "object") {
      return [];
    }

    const storedObject = stored as Record<string, unknown>;
    const content = Object.fromEntries(
      fields.map((field) => [field, typeof storedObject[field] === "string" ? (storedObject[field] as string).trim() : ""]),
    ) as Record<K, string>;

    return [[locale, { content, meta }] as const];
  });

  return Object.fromEntries(entries);
}

/** Inverse of parseShortTextTranslations for one locale, ready for a Mongo $set. */
export function toStoredShortTextTranslation<K extends string>(
  translation: StoredShortTextTranslation<K>,
): Record<string, unknown> {
  return {
    ...translation.content,
    source: translation.meta.source,
    sourceHash: translation.meta.sourceHash,
    translatedAt: translation.meta.translatedAt ? new Date(translation.meta.translatedAt) : null,
  };
}

export function parseTranslationMetaMap(value: unknown): Partial<Record<TranslationTargetLocale, TranslationMeta>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const object = value as Record<string, unknown>;
  const entries = translationTargetLocales.flatMap((locale) => {
    const meta = parseTranslationMeta(object[locale]);

    return meta ? [[locale, meta] as const] : [];
  });

  return Object.fromEntries(entries);
}
