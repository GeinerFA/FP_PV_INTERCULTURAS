import { defaultLocale, locales, type AppLocale } from "@/config/i18n";
import { buildFallbackProgramCategorySummary, getProgramCategoryMap } from "@/services/categories/category-service";
import type {
  CreateProgramRecordInput,
  DeleteProgramInput,
  LocalizedProgram,
  Program,
  ProgramRecord,
  ProgramSnapshot,
  ProgramWorkflowMutationInput,
  PublishProgramInput,
  UpdateProgramDraftInput,
} from "@/types/program";
import type { ProgramCategorySummary } from "@/types/category";

import { getProgramRepository } from "./program-repository";

function isRecoverablePublicProgramReadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (
    error.name === "MongooseServerSelectionError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoParseError" ||
    error.message.includes("MONGODB_URI environment variable is required") ||
    error.message.includes("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number")
  ) {
    return true;
  }

  return false;
}

function handleRecoverablePublicProgramReadError<T>(operation: string, error: unknown, fallback: T): T {
  if (!isRecoverablePublicProgramReadError(error)) {
    throw error;
  }

  console.error(`[program-service] ${operation} fallback`, error);

  return fallback;
}

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

function resolveProgramCategoryDetails(
  category: string,
  categoryMap: Map<string, ProgramCategorySummary>,
): ProgramCategorySummary {
  return categoryMap.get(category) ?? buildFallbackProgramCategorySummary(category);
}

function toAdminProgram(record: ProgramRecord, categoryMap: Map<string, ProgramCategorySummary>): Program {
  return {
    ...record,
    ...record.draftSnapshot,
    categoryDetails: resolveProgramCategoryDetails(record.draftSnapshot.category, categoryMap),
    status: record.workflowState,
  };
}

export function createEmptyProgramSnapshot(): ProgramSnapshot {
  return {
    slug: "",
    category: "",
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
  categoryMap: Map<string, ProgramCategorySummary>,
): LocalizedProgram {
  const resolvedLocale = resolveProgramLocale(locale);
  const translation = snapshot.translations[resolvedLocale] ?? snapshot.translations[defaultLocale];
  const seo = snapshot.seo[resolvedLocale] ?? snapshot.seo[defaultLocale];

  return {
    id: record.id,
    slug: snapshot.slug,
    category: snapshot.category,
    categoryDetails: resolveProgramCategoryDetails(snapshot.category, categoryMap),
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
  try {
    const [programs, categoryMap] = await Promise.all([
      getProgramRepository().list({ seedBootstrap: true }),
      getProgramCategoryMap(),
    ]);

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
      .map(({ record, snapshot }) => localizeProgramSnapshot(record, snapshot, locale, categoryMap));
  } catch (error) {
    return handleRecoverablePublicProgramReadError("listPublicPrograms", error, []);
  }
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
  try {
    const [program, categoryMap] = await Promise.all([
      getProgramRepository().findPublishedBySlug(slug),
      getProgramCategoryMap(),
    ]);

    if (!program || program.workflowState !== "published" || !program.publishedSnapshot) {
      return null;
    }

    return localizeProgramSnapshot(program, program.publishedSnapshot, locale, categoryMap);
  } catch (error) {
    return handleRecoverablePublicProgramReadError("getPublicProgramBySlug", error, null);
  }
}

export async function listAdminPrograms(): Promise<Program[]> {
  const [programs, categoryMap] = await Promise.all([
    getProgramRepository().list({ seedBootstrap: false }),
    getProgramCategoryMap(),
  ]);

  return sortPrograms(programs.map((program) => toAdminProgram(program, categoryMap)));
}

export async function getAdminProgramById(id: string): Promise<Program | null> {
  const [program, categoryMap] = await Promise.all([getProgramRepository().findById(id), getProgramCategoryMap()]);

  return program ? toAdminProgram(program, categoryMap) : null;
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
  const categoryMap = await getProgramCategoryMap();

  return toAdminProgram(await repository.create(input), categoryMap);
}

export async function saveAdminProgramDraft(input: UpdateProgramDraftInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const [record, categoryMap] = await Promise.all([repository.saveDraft(input), getProgramCategoryMap()]);

  return record ? toAdminProgram(record, categoryMap) : null;
}

export async function publishAdminProgram(input: PublishProgramInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const [record, categoryMap] = await Promise.all([repository.publish(input), getProgramCategoryMap()]);

  return record ? toAdminProgram(record, categoryMap) : null;
}

export async function archiveAdminProgram(input: ProgramWorkflowMutationInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const [record, categoryMap] = await Promise.all([repository.archive(input), getProgramCategoryMap()]);

  return record ? toAdminProgram(record, categoryMap) : null;
}

export async function deleteAdminProgram(input: DeleteProgramInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const [record, categoryMap] = await Promise.all([repository.delete(input), getProgramCategoryMap()]);

  return record ? toAdminProgram(record, categoryMap) : null;
}

export async function reactivateAdminProgram(input: ProgramWorkflowMutationInput): Promise<Program | null> {
  const repository = getProgramRepository();
  const [record, categoryMap] = await Promise.all([repository.reactivate(input), getProgramCategoryMap()]);

  return record ? toAdminProgram(record, categoryMap) : null;
}
