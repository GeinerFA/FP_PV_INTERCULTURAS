import { sourceLocale, type AppLocale, type TranslationTargetLocale } from "@/config/i18n";
import type { TranslationSyncResult } from "@/lib/translation";
import {
  resolveShortTextTranslation,
  type ResolveShortTextTranslationInput,
} from "@/services/translation/short-text-translation";
import type {
  AdminProgramCategory,
  CreateProgramCategoryInput,
  DeleteProgramCategoryInput,
  ProgramCategoryRecord,
  ProgramCategorySummary,
  ProgramCategoryTheme,
  ProgramCategoryTranslatableContent,
  UpdateProgramCategoryInput,
} from "@/types/category";

import { getProgramCategoryRepository } from "./category-repository";

export { ProgramCategoryDuplicateFieldError, ProgramCategoryInUseError } from "./category-repository";

function humanizeCategoryCode(code: string): string {
  return code
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildFallbackProgramCategorySummary(code: string): ProgramCategorySummary {
  return {
    code,
    name: humanizeCategoryCode(code),
    theme: "slate" satisfies ProgramCategoryTheme,
  };
}

export async function listProgramCategories(): Promise<ProgramCategoryRecord[]> {
  return getProgramCategoryRepository().list({ seedBootstrap: true });
}

export async function listAdminProgramCategories(): Promise<AdminProgramCategory[]> {
  return getProgramCategoryRepository().listForAdmin({ seedBootstrap: true });
}

/** Category summaries keyed by code, named in `locale` (falling back to the source name if untranslated). */
export async function getProgramCategoryMap(locale: AppLocale = sourceLocale): Promise<Map<string, ProgramCategorySummary>> {
  const categories = await listProgramCategories();

  return new Map(
    categories.map((category) => [
      category.code,
      {
        code: category.code,
        name: (locale === sourceLocale ? null : category.translations[locale]?.content.name) || category.name,
        theme: category.theme,
      },
    ]),
  );
}

/**
 * Generates, refreshes or stores the translation of one category name.
 * `submitted` holds the target-locale name from the admin form (empty = translate automatically).
 */
export async function syncProgramCategoryTranslation(
  id: string,
  locale: TranslationTargetLocale,
  options: Pick<ResolveShortTextTranslationInput<ProgramCategoryTranslatableContent>, "submitted" | "force" | "beforeTranslate"> = {},
): Promise<TranslationSyncResult> {
  const repository = getProgramCategoryRepository();
  const category = await repository.findById(id);

  if (!category) {
    throw new Error(`Program category ${id} was not found.`);
  }

  const { next, result } = await resolveShortTextTranslation({
    locale,
    source: { name: category.name },
    current: category.translations[locale] ?? null,
    ...options,
  });

  if (next) {
    await repository.saveTranslation(id, locale, next);
  }

  return result;
}

/** Translates every category missing a translation or with a stale machine translation. */
export async function syncPendingProgramCategoryTranslations(locale: TranslationTargetLocale): Promise<TranslationSyncResult[]> {
  const categories = await listProgramCategories();
  const results: TranslationSyncResult[] = [];

  for (const category of categories) {
    results.push(await syncProgramCategoryTranslation(category.id, locale));
  }

  return results;
}

export async function createAdminProgramCategory(input: CreateProgramCategoryInput): Promise<ProgramCategoryRecord> {
  return getProgramCategoryRepository().create(input);
}

export async function updateAdminProgramCategory(input: UpdateProgramCategoryInput): Promise<ProgramCategoryRecord | null> {
  return getProgramCategoryRepository().update(input);
}

export async function deleteAdminProgramCategory(input: DeleteProgramCategoryInput): Promise<ProgramCategoryRecord | null> {
  return getProgramCategoryRepository().delete(input);
}
