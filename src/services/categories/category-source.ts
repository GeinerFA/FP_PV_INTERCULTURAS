import type { ProgramCategoryRecord } from "@/types/category";

export const legacyProgramCategorySeeds = [
  {
    code: "volunteer",
    name: "Voluntariado",
    theme: "emerald",
    order: 1,
  },
  {
    code: "internships",
    name: "Pasantías",
    theme: "sky",
    order: 2,
  },
  {
    code: "spanish-classes",
    name: "Clases de español",
    theme: "amber",
    order: 3,
  },
] as const satisfies Array<Pick<ProgramCategoryRecord, "code" | "name" | "theme" | "order">>;
