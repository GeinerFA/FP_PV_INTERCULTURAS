import type { TranslationTargetLocale } from "@/config/i18n";
import type { TranslationMeta } from "@/lib/translation/types";

export const programCategoryThemes = ["emerald", "sky", "amber", "violet", "rose", "slate"] as const;

export type ProgramCategoryTheme = (typeof programCategoryThemes)[number];

export type ProgramCategory = string;

export const programCategoryTranslatableFields = ["name"] as const;

export type ProgramCategoryTranslatableContent = Record<(typeof programCategoryTranslatableFields)[number], string>;

export type ProgramCategoryTranslation = {
  content: ProgramCategoryTranslatableContent;
  meta: TranslationMeta;
};

export type ProgramCategoryRecord = {
  id: string;
  code: ProgramCategory;
  /** Source-locale name. */
  name: string;
  translations: Partial<Record<TranslationTargetLocale, ProgramCategoryTranslation>>;
  theme: ProgramCategoryTheme;
  order: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramCategorySummary = Pick<ProgramCategoryRecord, "code" | "name" | "theme">;

export type AdminProgramCategory = ProgramCategoryRecord & {
  programCount: number;
};

export type CreateProgramCategoryInput = {
  name: string;
  theme: ProgramCategoryTheme;
  createdBy: string;
  updatedBy: string;
};

export type UpdateProgramCategoryInput = {
  id: string;
  name: string;
  theme: ProgramCategoryTheme;
  updatedBy: string;
};

export type DeleteProgramCategoryInput = {
  id: string;
};
