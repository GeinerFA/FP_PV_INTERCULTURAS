import { sourceLocale, type AppLocale, type TranslationTargetLocale } from "@/config/i18n";
import { hashTranslatableContent, resolveTranslationStatus } from "@/lib/translation";
import type { TranslationMeta, TranslationStatus } from "@/lib/translation/types";
import type { ProgramSnapshot, ProgramTranslatableContent } from "@/types/program";

/** Reads every translatable field of one locale out of a snapshot. */
export function extractProgramTranslatableContent(
  snapshot: ProgramSnapshot,
  locale: AppLocale,
): ProgramTranslatableContent {
  const translation = snapshot.translations[locale];
  const seo = snapshot.seo[locale];

  return {
    title: translation?.title ?? "",
    shortDescription: translation?.shortDescription ?? "",
    fullDescription: translation?.fullDescription ?? "",
    requirements: translation?.requirements ?? [],
    included: translation?.included ?? [],
    location: snapshot.location[locale] ?? "",
    duration: snapshot.duration[locale] ?? "",
    availability: snapshot.availability[locale] ?? "",
    seoTitle: seo?.title ?? "",
    seoDescription: seo?.description ?? "",
  };
}

/** Hash of the source-locale content (no slug, images or metadata): if it changes, translations are stale. */
export function hashProgramSourceContent(snapshot: ProgramSnapshot): string {
  const content = extractProgramTranslatableContent(snapshot, sourceLocale);

  return hashTranslatableContent([
    content.title,
    content.shortDescription,
    content.fullDescription,
    content.requirements,
    content.included,
    content.location,
    content.duration,
    content.availability,
    content.seoTitle,
    content.seoDescription,
  ]);
}

export function getProgramTranslationMeta(
  snapshot: ProgramSnapshot,
  locale: TranslationTargetLocale,
): TranslationMeta | null {
  return snapshot.translationMeta?.[locale] ?? null;
}

export function getProgramTranslationStatus(
  snapshot: ProgramSnapshot,
  locale: TranslationTargetLocale,
): TranslationStatus {
  return resolveTranslationStatus(hashProgramSourceContent(snapshot), getProgramTranslationMeta(snapshot, locale));
}

/** A locale is shown publicly only once it has a title; otherwise the program stays in the source locale only. */
export function hasProgramLocaleContent(snapshot: ProgramSnapshot, locale: AppLocale): boolean {
  return (snapshot.translations[locale]?.title ?? "").trim().length > 0;
}

const programScalarFields = [
  "title",
  "shortDescription",
  "fullDescription",
  "location",
  "duration",
  "availability",
  "seoTitle",
  "seoDescription",
] as const;

/** Flattens the content into one text array: scalar fields first, then each list in order. */
export function flattenProgramTranslatableContent(content: ProgramTranslatableContent): string[] {
  return [
    ...programScalarFields.map((field) => content[field]),
    ...content.requirements,
    ...content.included,
  ];
}

/**
 * Rebuilds the fields by position from a translated array produced from `source`.
 * If the provider returned an empty text for a non-empty source field, the source text is kept
 * rather than leaving the field blank.
 */
export function rebuildProgramTranslatableContent(
  translatedTexts: string[],
  source: ProgramTranslatableContent,
): ProgramTranslatableContent {
  const scalars = Object.fromEntries(
    programScalarFields.map((field, index) => [field, translatedTexts[index]?.trim() || source[field]]),
  ) as Pick<ProgramTranslatableContent, (typeof programScalarFields)[number]>;
  let offset = programScalarFields.length;
  const takeList = (sourceList: string[]) => {
    const list = sourceList.map((entry, index) => translatedTexts[offset + index]?.trim() || entry);

    offset += sourceList.length;

    return list;
  };

  return {
    ...scalars,
    requirements: takeList(source.requirements),
    included: takeList(source.included),
  };
}

/** Returns a copy of the snapshot with one locale's content and translation meta replaced. */
export function applyProgramLocaleContent(
  snapshot: ProgramSnapshot,
  locale: TranslationTargetLocale,
  content: ProgramTranslatableContent,
  meta: TranslationMeta,
): ProgramSnapshot {
  return {
    ...snapshot,
    location: { ...snapshot.location, [locale]: content.location },
    duration: { ...snapshot.duration, [locale]: content.duration },
    availability: { ...snapshot.availability, [locale]: content.availability },
    translations: {
      ...snapshot.translations,
      [locale]: {
        title: content.title,
        shortDescription: content.shortDescription,
        fullDescription: content.fullDescription,
        requirements: content.requirements,
        included: content.included,
      },
    },
    seo: {
      ...snapshot.seo,
      [locale]: { title: content.seoTitle, description: content.seoDescription },
    },
    translationMeta: { ...snapshot.translationMeta, [locale]: meta },
  };
}
