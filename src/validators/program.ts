import { locales, type AppLocale } from "@/config/i18n";
import {
  programCategories,
  programStatuses,
  type LocalizedText,
  type Program,
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

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value.trim();
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

function assertStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
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

function assertLocalizedText(value: unknown, path: string): LocalizedText {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertString(object[locale], `${path}.${locale}`)]),
  ) as LocalizedText;
}

function assertProgramTranslation(value: unknown, path: string): ProgramTranslation {
  const object = assertPlainObject(value, path);

  return {
    title: assertString(object.title, `${path}.title`),
    shortDescription: assertString(object.shortDescription, `${path}.shortDescription`),
    fullDescription: assertString(object.fullDescription, `${path}.fullDescription`),
    requirements: assertStringArray(object.requirements, `${path}.requirements`),
    included: assertStringArray(object.included, `${path}.included`),
  };
}

function assertProgramSeoEntry(value: unknown, path: string): ProgramSeoEntry {
  const object = assertPlainObject(value, path);

  return {
    title: assertString(object.title, `${path}.title`),
    description: assertString(object.description, `${path}.description`),
  };
}

function assertTranslations(value: unknown, path: string): Record<AppLocale, ProgramTranslation> {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertProgramTranslation(object[locale], `${path}.${locale}`)]),
  ) as Record<AppLocale, ProgramTranslation>;
}

function assertSeo(value: unknown, path: string): Record<AppLocale, ProgramSeoEntry> {
  const object = assertPlainObject(value, path);

  return Object.fromEntries(
    locales.map((locale) => [locale, assertProgramSeoEntry(object[locale], `${path}.${locale}`)]),
  ) as Record<AppLocale, ProgramSeoEntry>;
}

function assertSlug(value: unknown, path: string): string {
  const slug = assertString(value, path);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${path} must be a lowercase slug.`);
  }

  return slug;
}

export function parseProgram(value: unknown, path = "program"): Program {
  const object = assertPlainObject(value, path);

  return {
    id: assertString(object.id, `${path}.id`),
    slug: assertSlug(object.slug, `${path}.slug`),
    category: assertEnum(object.category, programCategories, `${path}.category`) as ProgramCategory,
    status: assertEnum(object.status, programStatuses, `${path}.status`) as ProgramStatus,
    featured: assertBoolean(object.featured, `${path}.featured`),
    coverImage: assertString(object.coverImage, `${path}.coverImage`),
    location: assertLocalizedText(object.location, `${path}.location`),
    duration: assertLocalizedText(object.duration, `${path}.duration`),
    availability: assertLocalizedText(object.availability, `${path}.availability`),
    translations: assertTranslations(object.translations, `${path}.translations`),
    seo: assertSeo(object.seo, `${path}.seo`),
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}

export function parseProgramCatalog(value: unknown, path = "programCatalog"): Program[] {
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
