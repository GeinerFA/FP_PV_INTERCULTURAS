import {
  programCategoryThemes,
  type ProgramCategoryRecord,
  type ProgramCategoryTheme,
} from "@/types/category";

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

function assertInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return value;
}

function assertIsoDate(value: unknown, path: string): string {
  const isoDate = assertString(value, path);

  if (Number.isNaN(Date.parse(isoDate))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return new Date(isoDate).toISOString();
}

function assertCategoryCode(value: unknown, path: string): string {
  const code = assertString(value, path).toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
    throw new Error(`${path} must be a lowercase code.`);
  }

  return code;
}

function assertTheme(value: unknown, path: string): ProgramCategoryTheme {
  if (typeof value !== "string" || !programCategoryThemes.includes(value as ProgramCategoryTheme)) {
    throw new Error(`${path} must be one of: ${programCategoryThemes.join(", ")}.`);
  }

  return value as ProgramCategoryTheme;
}

export function parseProgramCategoryContent(
  value: unknown,
  path = "programCategoryContent",
): Pick<ProgramCategoryRecord, "code" | "name" | "theme"> {
  const object = assertPlainObject(value, path);
  const name = assertString(object.name, `${path}.name`);
  const code = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (code.length === 0) {
    throw new Error(`${path}.name must include at least one letter or number.`);
  }

  return {
    code,
    name,
    theme: assertTheme(object.theme, `${path}.theme`),
  };
}

export function parseProgramCategoryUpdateContent(
  value: unknown,
  path = "programCategoryUpdateContent",
): Pick<ProgramCategoryRecord, "name" | "theme"> {
  const object = assertPlainObject(value, path);

  return {
    name: assertString(object.name, `${path}.name`),
    theme: assertTheme(object.theme, `${path}.theme`),
  };
}

export function parseProgramCategoryRecord(value: unknown, path = "programCategoryRecord"): ProgramCategoryRecord {
  const object = assertPlainObject(value, path);

  return {
    id: assertString(object.id, `${path}.id`),
    code: assertCategoryCode(object.code, `${path}.code`),
    name: assertString(object.name, `${path}.name`),
    theme: assertTheme(object.theme, `${path}.theme`),
    order: assertInteger(object.order, `${path}.order`),
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}
