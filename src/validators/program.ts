import { locales, type AppLocale } from "@/config/i18n";
import {
  programCategories,
  programStatuses,
  type ProgramRecord,
  type ProgramSnapshot,
  type ProgramSourceEntry,
  type LocalizedText,
  type ProgramCategory,
  type ProgramSeoEntry,
  type ProgramStatus,
  type ProgramTranslation,
} from "@/types/program";

type PlainObject = Record<string, unknown>;

function assertPlainObject(value: unknown, path: string): PlainObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }

  return value as PlainObject;
}

function assertString(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== "string") {
    throw new Error(`${path} must be a string.`);
  }

  const normalized = value.trim();

  if (!allowEmpty && normalized.length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return normalized;
}

function assertBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${path} must be a boolean.`);
  }

  return value;
}

function assertEnum<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${path} must be one of: ${allowed.join(", ")}.`);
  }

  return value as T;
}

function assertStringArray(value: unknown, path: string, allowEmpty = false): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be a string array.`);
  }

  if (!allowEmpty && value.length === 0) {
    throw new Error(`${path} must be a non-empty string array.`);
  }

  return value.map((entry, index) => assertString(entry, `${path}[${index}]`));
}

function assertIsoDate(value: unknown, path: string): string {
  const date = assertString(value, path);

  if (Number.isNaN(Date.parse(date))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return date;
}

function assertLocalizedText(value: unknown, path: string, allowEmpty = false): LocalizedText {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertString(object[locale], `${path}.${locale}`, allowEmpty)]),
  ) as LocalizedText;
}

function assertProgramTranslation(value: unknown, path: string, allowEmpty = false): ProgramTranslation {
  const object = assertPlainObject(value, path);

  return {
    title: assertString(object.title, `${path}.title`, allowEmpty),
    shortDescription: assertString(object.shortDescription, `${path}.shortDescription`, allowEmpty),
    fullDescription: assertString(object.fullDescription, `${path}.fullDescription`, allowEmpty),
    requirements: assertStringArray(object.requirements, `${path}.requirements`, allowEmpty),
    included: assertStringArray(object.included, `${path}.included`, allowEmpty),
  };
}

function assertProgramSeoEntry(value: unknown, path: string, allowEmpty = false): ProgramSeoEntry {
  const object = assertPlainObject(value, path);

  return {
    title: assertString(object.title, `${path}.title`, allowEmpty),
    description: assertString(object.description, `${path}.description`, allowEmpty),
  };
}

function assertTranslations(
  value: unknown,
  path: string,
  allowEmpty = false,
): Record<AppLocale, ProgramTranslation> {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertProgramTranslation(object[locale], `${path}.${locale}`, allowEmpty)]),
  ) as Record<AppLocale, ProgramTranslation>;
}

function assertSeo(
  value: unknown,
  path: string,
  allowEmpty = false,
): Record<AppLocale, ProgramSeoEntry> {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertProgramSeoEntry(object[locale], `${path}.${locale}`, allowEmpty)]),
  ) as Record<AppLocale, ProgramSeoEntry>;
}

function assertSlug(value: unknown, path: string, allowEmpty = false): string {
  const slug = assertString(value, path, allowEmpty);

  if (allowEmpty && slug.length === 0) {
    return slug;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${path} must be a lowercase slug.`);
  }

  return slug;
}

function assertNullableIsoDate(value: unknown, path: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return assertIsoDate(value, path);
}

function assertProgramSnapshotPublishable(snapshot: ProgramSnapshot, path: string): ProgramSnapshot {
  assertSlug(snapshot.slug, `${path}.slug`);
  assertString(snapshot.coverImage, `${path}.coverImage`);
  assertLocalizedText(snapshot.location, `${path}.location`);
  assertLocalizedText(snapshot.duration, `${path}.duration`);
  assertLocalizedText(snapshot.availability, `${path}.availability`);
  assertTranslations(snapshot.translations, `${path}.translations`);
  assertSeo(snapshot.seo, `${path}.seo`);

  return snapshot;
}

export function parseProgramSnapshot(value: unknown, path = "programSnapshot"): ProgramSnapshot {
  const object = assertPlainObject(value, path);

  return {
    slug: assertSlug(object.slug, `${path}.slug`, true),
    category: assertEnum(object.category, programCategories, `${path}.category`) as ProgramCategory,
    featured: assertBoolean(object.featured, `${path}.featured`),
    coverImage: assertString(object.coverImage, `${path}.coverImage`, true),
    location: assertLocalizedText(object.location, `${path}.location`, true),
    duration: assertLocalizedText(object.duration, `${path}.duration`, true),
    availability: assertLocalizedText(object.availability, `${path}.availability`, true),
    translations: assertTranslations(object.translations, `${path}.translations`, true),
    seo: assertSeo(object.seo, `${path}.seo`, true),
  };
}

export function validateProgramSnapshotForPublish(
  snapshot: ProgramSnapshot,
  path = "programSnapshot",
): ProgramSnapshot {
  return assertProgramSnapshotPublishable(snapshot, path);
}

export function validatePublishedSlugImmutability(
  currentRecord: Pick<ProgramRecord, "publishedSnapshot" | "firstPublishedAt">,
  nextSnapshot: ProgramSnapshot,
  path = "programSnapshot",
): ProgramSnapshot {
  if (
    currentRecord.firstPublishedAt &&
    currentRecord.publishedSnapshot &&
    currentRecord.publishedSnapshot.slug !== nextSnapshot.slug
  ) {
    throw new Error(`${path}.slug cannot change after the first publish.`);
  }

  return nextSnapshot;
}

export function parseProgramRecord(value: unknown, path = "programRecord"): ProgramRecord {
  const object = assertPlainObject(value, path);
  const draftSnapshot = parseProgramSnapshot(object.draftSnapshot, `${path}.draftSnapshot`);
  const publishedSnapshot =
    object.publishedSnapshot === null || object.publishedSnapshot === undefined
      ? null
      : parseProgramSnapshot(object.publishedSnapshot, `${path}.publishedSnapshot`);
  const firstPublishedAt = assertNullableIsoDate(object.firstPublishedAt, `${path}.firstPublishedAt`);
  const record: ProgramRecord = {
    id: assertString(object.id, `${path}.id`),
    workflowState: assertEnum(object.workflowState, programStatuses, `${path}.workflowState`) as ProgramStatus,
    draftSnapshot,
    publishedSnapshot,
    firstPublishedAt,
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };

  if (record.workflowState === "published" && !record.publishedSnapshot) {
    throw new Error(`${path}.publishedSnapshot is required when workflowState is published.`);
  }

  if (record.publishedSnapshot && !record.firstPublishedAt) {
    throw new Error(`${path}.firstPublishedAt is required when publishedSnapshot exists.`);
  }

  if (record.firstPublishedAt && !record.publishedSnapshot) {
    throw new Error(`${path}.publishedSnapshot is required when firstPublishedAt exists.`);
  }

  if (record.publishedSnapshot) {
    assertProgramSnapshotPublishable(record.publishedSnapshot, `${path}.publishedSnapshot`);
  }

  validatePublishedSlugImmutability(record, record.draftSnapshot, `${path}.draftSnapshot`);

  return record;
}

export function parseProgram(value: unknown, path = "program"): ProgramSourceEntry {
  const object = assertPlainObject(value, path);
  const snapshot = parseProgramSnapshot(object, path);
  const status = assertEnum(object.status, programStatuses, `${path}.status`) as ProgramStatus;

  assertProgramSnapshotPublishable(snapshot, path);

  return {
    id: assertString(object.id, `${path}.id`),
    status,
    ...snapshot,
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}

export function parseProgramCatalog(value: unknown, path = "programCatalog"): ProgramSourceEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array.`);
  }

  const programs = value.map((entry, index) => parseProgram(entry, `${path}[${index}]`));
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const program of programs) {
    if (ids.has(program.id)) {
      throw new Error(`${path} contains duplicate id: ${program.id}`);
    }

    if (slugs.has(program.slug)) {
      throw new Error(`${path} contains duplicate slug: ${program.slug}`);
    }

    ids.add(program.id);
    slugs.add(program.slug);
  }

  return programs;
}
