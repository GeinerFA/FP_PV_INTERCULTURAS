import type {
  AdminProgramCategory,
  CreateProgramCategoryInput,
  DeleteProgramCategoryInput,
  ProgramCategoryRecord,
  ProgramCategorySummary,
  ProgramCategoryTheme,
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

export async function getProgramCategoryMap(): Promise<Map<string, ProgramCategorySummary>> {
  const categories = await listProgramCategories();

  return new Map(
    categories.map((category) => [
      category.code,
      {
        code: category.code,
        name: category.name,
        theme: category.theme,
      },
    ]),
  );
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
