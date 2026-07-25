export const programCategoryThemes = ["emerald", "sky", "amber", "violet", "rose", "slate"] as const;

export type ProgramCategoryTheme = (typeof programCategoryThemes)[number];

export type ProgramCategory = string;

export type ProgramCategoryRecord = {
  id: string;
  code: ProgramCategory;
  name: string;
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
