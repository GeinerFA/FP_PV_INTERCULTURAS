import type { Program } from "@/types/program";

import { programCatalog } from "./program-source";

export type ProgramRepository = {
  list(): Promise<Program[]>;
  findById(id: string): Promise<Program | null>;
  findBySlug(slug: string): Promise<Program | null>;
};

const mockProgramRepository: ProgramRepository = {
  async list() {
    return [...programCatalog];
  },
  async findById(id) {
    return programCatalog.find((program) => program.id === id) ?? null;
  },
  async findBySlug(slug) {
    return programCatalog.find((program) => program.slug === slug) ?? null;
  },
};

export function getProgramRepository(): ProgramRepository {
  return mockProgramRepository;
}
