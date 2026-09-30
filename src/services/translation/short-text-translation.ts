import { sourceLocale, type TranslationTargetLocale } from "@/config/i18n";
import {
  getTranslator,
  hashTranslatableContent,
  resolveTranslationStatus,
  translateTexts,
  type TranslationStatus,
  type TranslationSyncResult,
  type Translator,
} from "@/lib/translation";
import type { TranslationMeta } from "@/lib/translation/types";

/** A small record of texts (FAQ question/answer, category name) translated as a unit. */
export type ShortTextContent = Record<string, string>;

export type ShortTextTranslation<T extends ShortTextContent> = {
  content: T;
  meta: TranslationMeta;
};

export type ResolveShortTextTranslationInput<T extends ShortTextContent> = {
  locale: TranslationTargetLocale;
  source: T;
  current: ShortTextTranslation<T> | null;
  /**
   * Target-locale values submitted by the admin, or null when the form did not include them.
   * Any empty field means "translate automatically"; edited values are kept as a manual translation.
   */
  submitted?: T | null;
  force?: boolean;
  beforeTranslate?: () => void;
  translator?: Translator | null;
};

export type ResolveShortTextTranslationResult<T extends ShortTextContent> = {
  /** New translation to persist, or null to leave the stored one unchanged. */
  next: ShortTextTranslation<T> | null;
  result: TranslationSyncResult;
};

export function hashShortTextSource(source: ShortTextContent): string {
  return hashTranslatableContent(Object.keys(source).sort().map((key) => [key, source[key]]));
}

export function getShortTextTranslationStatus(
  source: ShortTextContent,
  current: { meta: TranslationMeta } | null | undefined,
): TranslationStatus {
  return resolveTranslationStatus(hashShortTextSource(source), current?.meta ?? null);
}

function hasEveryField<T extends ShortTextContent>(content: T): boolean {
  return Object.values(content).every((value) => value.trim().length > 0);
}

function isSameContent<T extends ShortTextContent>(left: T, right: T | undefined): boolean {
  return Boolean(right) && Object.keys(left).every((key) => left[key].trim() === (right?.[key] ?? "").trim());
}

export async function resolveShortTextTranslation<T extends ShortTextContent>({
  locale,
  source,
  current,
  submitted = null,
  force = false,
  beforeTranslate,
  translator: translatorOverride,
}: ResolveShortTextTranslationInput<T>): Promise<ResolveShortTextTranslationResult<T>> {
  const sourceHash = hashShortTextSource(source);
  let shouldForce = force;

  if (submitted) {
    if (!hasEveryField(submitted)) {
      // A cleared field asks for a fresh machine translation of the whole entry.
      shouldForce = true;
    } else if (!isSameContent(submitted, current?.content)) {
      const trimmed = Object.fromEntries(Object.entries(submitted).map(([key, value]) => [key, value.trim()])) as T;

      return {
        next: {
          content: trimmed,
          meta: { source: "manual", sourceHash, translatedAt: current?.meta.translatedAt ?? null },
        },
        result: "up-to-date",
      };
    }
  }

  if (!shouldForce && current?.meta.sourceHash === sourceHash) {
    return { next: null, result: "up-to-date" };
  }

  if (!shouldForce && current?.meta.source === "manual") {
    return { next: null, result: "manual" };
  }

  const translator = translatorOverride !== undefined ? translatorOverride : getTranslator();

  if (!translator) {
    return { next: null, result: "not-configured" };
  }

  beforeTranslate?.();

  const keys = Object.keys(source);
  const translatedTexts = await translateTexts(
    translator,
    keys.map((key) => source[key]),
    sourceLocale,
    locale,
  );
  const content = Object.fromEntries(
    keys.map((key, index) => [key, translatedTexts[index] || source[key]]),
  ) as T;

  return {
    next: {
      content,
      meta: { source: "machine", sourceHash, translatedAt: new Date().toISOString() },
    },
    result: "translated",
  };
}
