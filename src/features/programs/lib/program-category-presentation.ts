import type { ProgramCategorySummary, ProgramCategoryTheme } from "@/types/category";

const programCategoryThemeClassNames: Record<ProgramCategoryTheme, string> = {
  emerald: "bg-emerald-200 text-emerald-900",
  sky: "bg-sky-200 text-sky-900",
  amber: "bg-amber-200 text-amber-900",
  violet: "bg-violet-200 text-violet-900",
  rose: "bg-rose-200 text-rose-900",
  slate: "bg-slate-200 text-slate-900",
};

export function getProgramCategoryBadgeClassName(category: Pick<ProgramCategorySummary, "theme"> | null | undefined): string {
  return programCategoryThemeClassNames[category?.theme ?? "slate"];
}

export function getProgramCategoryName(category: Pick<ProgramCategorySummary, "name"> | null | undefined, fallbackCode: string): string {
  if (category?.name) {
    return category.name;
  }

  return fallbackCode
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
