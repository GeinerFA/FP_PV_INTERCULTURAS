import type { AppLocale } from "@/config/i18n";
import type { LocalizedProgram, Program } from "@/types/program";

import { getProgramRepository } from "./program-repository";

function sortPrograms(programs: Program[]) {
  return [...programs].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function localizeProgram(program: Program, locale: AppLocale): LocalizedProgram {
  const translation = program.translations[locale];
  const seo = program.seo[locale];

  return {
    id: program.id,
    slug: program.slug,
    category: program.category,
    status: program.status,
    featured: program.featured,
    coverImage: program.coverImage,
    location: program.location[locale],
    duration: program.duration[locale],
    availability: program.availability[locale],
    title: translation.title,
    shortDescription: translation.shortDescription,
    fullDescription: translation.fullDescription,
    requirements: translation.requirements,
    included: translation.included,
    seoTitle: seo.title,
    seoDescription: seo.description,
    createdBy: program.createdBy,
    updatedBy: program.updatedBy,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
  };
}

export async function listPublicPrograms(locale: AppLocale): Promise<LocalizedProgram[]> {
  const repository = getProgramRepository();
  const programs = await repository.list();

  return sortPrograms(programs)
    .filter((program) => program.status === "published")
    .map((program) => localizeProgram(program, locale));
}

export async function listFeaturedPublicPrograms(
  locale: AppLocale,
  limit = 3,
): Promise<LocalizedProgram[]> {
  const programs = await listPublicPrograms(locale);

  return programs.filter((program) => program.featured).slice(0, limit);
}

export async function getPublicProgramBySlug(
  slug: string,
  locale: AppLocale,
): Promise<LocalizedProgram | null> {
  const repository = getProgramRepository();
  const program = await repository.findBySlug(slug);

  if (!program || program.status !== "published") {
    return null;
  }

  return localizeProgram(program, locale);
}

export async function listAdminPrograms(): Promise<Program[]> {
  const repository = getProgramRepository();

  return sortPrograms(await repository.list());
}

export async function getAdminProgramById(id: string): Promise<Program | null> {
  const repository = getProgramRepository();

  return repository.findById(id);
}
