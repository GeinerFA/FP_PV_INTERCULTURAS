import { sourceLocale, type AppLocale, type TranslationTargetLocale } from "@/config/i18n";
import type { TranslationSyncResult } from "@/lib/translation";
import {
  resolveShortTextTranslation,
  type ResolveShortTextTranslationInput,
} from "@/services/translation/short-text-translation";
import type {
  CreateFaqInput,
  DeleteFaqInput,
  FaqEntry,
  FaqTranslatableContent,
  MoveFaqInput,
  UpdateFaqInput,
} from "@/types/faq";

import { getFaqRepository } from "./faq-repository";
import { getLegacyFaqSeedEntries } from "./faq-source";

function isRecoverablePublicFaqReadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "MongooseServerSelectionError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoParseError" ||
    error.message.includes("MONGODB_URI environment variable is required") ||
    error.message.includes("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number")
  );
}

function buildPublicFallbackEntries(): FaqEntry[] {
  const now = new Date(0).toISOString();

  return getLegacyFaqSeedEntries().map((entry, index) => ({
    id: `legacy-faq-${index + 1}`,
    question: entry.question,
    answer: entry.answer,
    translations: {},
    order: entry.order,
    createdBy: "legacy-bootstrap",
    updatedBy: "legacy-bootstrap",
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * FAQ entries with question/answer in the requested locale. Entries without a translation are left out
 * of translated locales instead of showing source-locale text there.
 */
export async function listPublicFaqEntries(locale: AppLocale): Promise<FaqEntry[]> {
  try {
    const entries = await getFaqRepository().list({ seedBootstrap: true });

    if (locale === sourceLocale) {
      return entries;
    }

    return entries.flatMap((entry) => {
      const translation = entry.translations[locale];

      return translation?.content.question && translation.content.answer
        ? [{ ...entry, question: translation.content.question, answer: translation.content.answer }]
        : [];
    });
  } catch (error) {
    if (!isRecoverablePublicFaqReadError(error)) {
      throw error;
    }

    console.error(`[faq-service] listPublicFaqEntries fallback (${locale})`, error);
    return buildPublicFallbackEntries();
  }
}

export async function listAdminFaqEntries(): Promise<FaqEntry[]> {
  return getFaqRepository().list({ seedBootstrap: true });
}

export async function createAdminFaq(input: CreateFaqInput): Promise<FaqEntry> {
  return getFaqRepository().create(input);
}

export async function updateAdminFaq(input: UpdateFaqInput): Promise<FaqEntry | null> {
  return getFaqRepository().update(input);
}

export async function deleteAdminFaq(input: DeleteFaqInput): Promise<FaqEntry | null> {
  return getFaqRepository().delete(input);
}

export async function moveAdminFaq(input: MoveFaqInput): Promise<FaqEntry[] | null> {
  return getFaqRepository().move(input);
}

function getFaqSourceContent(entry: FaqEntry): FaqTranslatableContent {
  return { question: entry.question, answer: entry.answer };
}

/**
 * Generates, refreshes or stores the translation of one FAQ entry.
 * `submitted` holds the target-locale fields from the admin form (empty = translate automatically).
 */
export async function syncFaqTranslation(
  id: string,
  locale: TranslationTargetLocale,
  options: Pick<ResolveShortTextTranslationInput<FaqTranslatableContent>, "submitted" | "force" | "beforeTranslate"> = {},
): Promise<TranslationSyncResult> {
  const repository = getFaqRepository();
  const entry = await repository.findById(id);

  if (!entry) {
    throw new Error(`FAQ ${id} was not found.`);
  }

  const { next, result } = await resolveShortTextTranslation({
    locale,
    source: getFaqSourceContent(entry),
    current: entry.translations[locale] ?? null,
    ...options,
  });

  if (next) {
    await repository.saveTranslation(id, locale, next);
  }

  return result;
}

/** Translates every FAQ entry that is missing a translation or has a stale machine translation. */
export async function syncPendingFaqTranslations(locale: TranslationTargetLocale): Promise<TranslationSyncResult[]> {
  const entries = await getFaqRepository().list({ seedBootstrap: true });
  const results: TranslationSyncResult[] = [];

  for (const entry of entries) {
    results.push(await syncFaqTranslation(entry.id, locale));
  }

  return results;
}
