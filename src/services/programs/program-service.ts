import { defaultLocale, locales, type AppLocale } from "@/config/i18n";
import type {
  CreateProgramRecordInput,
  LocalizedProgram,
  Program,
  ProgramRecord,
  ProgramSnapshot,
  ProgramWorkflowMutationInput,
  PublishProgramInput,
  UpdateProgramDraftInput,
} from "@/types/program";

import { getProgramRepository } from "./program-repository";

function resolveProgramLocale(locale: string): AppLocale {
  return locales.includes(locale as AppLocale) ? (locale as AppLocale) : defaultLocale;
}

function sortPrograms(programs: Program[]) {
  return [...programs].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function sortProgramRecords(programs: ProgramRecord[]) {
  return [...programs].sort((left, right) => {
    if (left.draftSnapshot.featured !== right.draftSnapshot.featured) {
      return Number(right.draftSnapshot.featured) - Number(left.draftSnapshot.featured);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function toAdminProgram(record: ProgramRecord): Program {
  return {
    ...record,
    ...record.draftSnapshot,
    status: record.workflowState,
  };
}

export function createEmptyProgramSnapshot(): ProgramSnapshot {
  return {
    slug: "",
    category: "volunteer",
    featured: false,
    coverImage: "",
    coverImageAsset: null,
    location: Object.fromEntries(locales.map((locale) => [locale, ""])) as unknown as ProgramSnapshot["location"],
    duration: Object.fromEntries(locales.map((locale) => [locale, ""])) as unknown as ProgramSnapshot["duration"],
    availability: Object.fromEntries(locales.map((locale) => [locale, ""])) as unknown as ProgramSnapshot["availability"],
    translations: Object.fromEntries(
      locales.map((locale) => [
        locale,
        {
          title: "",
          shortDescription: "",
          fullDescription: "",
          requirements: [],
          included: [],
        },
      ]),
    ) as unknown as ProgramSnapshot["translations"],
    seo: Object.fromEntries(
      locales.map((locale) => [
        locale,
        {
          title: "",
          description: "",
        },
      ]),
    ) as unknown as ProgramSnapshot["seo"],
  };
}

function localizeProgramSnapshot(
  record: ProgramRecord,
  snapshot: ProgramSnapshot,
  locale: AppLocale,
): LocalizedProgram {
  const resolvedLocale = resolveProgramLocale(locale);
  const translation = snapshot.translations[resolvedLocale] ?? snapshot.translations[defaultLocale];
  const seo = snapshot.seo[resolvedLocale] ?? snapshot.seo[defaultLocale];

  return {
    id: record.id,
    slug: snapshot.slug,
    category: snapshot.category,
    status: record.workflowState,
    workflowState: record.workflowState,
    featured: snapshot.featured,
    coverImage: snapshot.coverImage,
    location: snapshot.location[resolvedLocale] ?? snapshot.location[defaultLocale],
    duration: snapshot.duration[resolvedLocale] ?? snapshot.duration[defaultLocale],
    availability: snapshot.availability[resolvedLocale] ?? snapshot.availability[defaultLocale],
    title: translation.title,
    shortDescription: translation.shortDescription,
    fullDescription: translation.fullDescription,
    requirements: translation.requirements,
    included: translation.included,
    seoTitle: seo.title,
    seoDescription: seo.description,
    firstPublishedAt: record.firstPublishedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function listPublicPrograms(locale: AppLocale): Promise<LocalizedProgram[]> {
  const repository = getProgramRepository();
  const programs = await repository.list();

  return sortProgramRecords(programs)
    .map((program) => ({
      record: program,
      snapshot: program.publishedSnapshot,
    }))
    .filter(
      (
        program,
      ): program is {
        record: ProgramRecord;
        snapshot: ProgramSnapshot;
      } => program.record.workflowState === "published" && program.snapshot !== null,
    )
    .map(({ record, snapshot }) => localizeProgramSnapshot(record, snapshot, locale));
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
  const program = await repository.findPublishedBySlug(slug);

  if (!program || program.workflowState !== "published" || !program.publishedSnapshot) {
    return null;
  }

  return localizeProgramSnapshot(program, program.publishedSnapshot, locale);
}

export async function listAdminPrograms(): Promise<Program[]> {
  const repository = getProgramRepository();

  return sortPrograms((await repository.list()).map((program) => toAdminProgram(program)));
}

export async function getAdminProgramById(id: string): Promise<Program | null> {
  const repository = getProgramRepository();

  const program = await repository.findById(id);

  return program ? toAdminProgram(program) : null;
}

export async function getAdminProgramCoverImageById(
  id: string,
  state: "draft" | "published",
) {
  const repository = getProgramRepository();

  return repository.findCoverImageById(id, state);
}

export async function createAdminProgram(input: CreateProgramRecordInput): Promise<Program> {
  const repository = getProgramRepository();

  return toAdminProgram(await repository.create(input));
}

export async function saveAdminProgramDraft(input: UpdateProgramDraftInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const record = await repository.saveDraft(input);

  return record ? toAdminProgram(record) : null;
}

export async function publishAdminProgram(input: PublishProgramInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const record = await repository.publish(input);

  return record ? toAdminProgram(record) : null;
}

export async function archiveAdminProgram(input: ProgramWorkflowMutationInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const record = await repository.archive(input);

  return record ? toAdminProgram(record) : null;
}

export async function reactivateAdminProgram(input: ProgramWorkflowMutationInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const record = await repository.reactivate(input);

  return record ? toAdminProgram(record) : null;
}
