import {
  applicationStatuses,
  applicationTypeCodes,
  type Application,
  type ApplicationChangeActor,
  type ApplicationCurriculumSummary,
  type ApplicationCurriculumUpload,
  type ApplicationStatus,
  type ApplicationStatusHistoryEntry,
  type ApplicationSubmissionInput,
  type ApplicationTypeHistoryEntry,
  type ApplicationTypeSnapshot,
} from "@/types/application";

type PlainObject = Record<string, unknown>;

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  error: string;
};

type SafeParseResult<T> = ParseSuccess<T> | ParseFailure;

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

function assertNullableString(value: unknown, path: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return assertString(value, path);
}

function assertOptionalNullableString(value: unknown, path: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${path} must be a string when provided.`);
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function assertEnum<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${path} must be one of: ${allowed.join(", ")}.`);
  }

  return value as T;
}

function assertIsoDate(value: unknown, path: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const isoDate = assertString(value, path);

  if (Number.isNaN(Date.parse(isoDate))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return new Date(isoDate).toISOString();
}

function assertEmail(value: unknown, path: string): string {
  const email = assertString(value, path).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${path} must be a valid email address.`);
  }

  return email;
}

function assertInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${path} must be a non-negative integer.`);
  }

  return value;
}

function assertBinaryData(value: unknown, path: string): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (!(value instanceof Uint8Array)) {
    throw new Error(`${path} must be binary data.`);
  }

  return Buffer.from(value);
}

function assertApplicationCurriculumSummary(
  value: unknown,
  path: string,
): ApplicationCurriculumSummary {
  const object = assertPlainObject(value, path);

  return {
    fileName: assertString(object.fileName, `${path}.fileName`),
    contentType: assertString(object.contentType, `${path}.contentType`),
    sizeBytes: assertInteger(object.sizeBytes, `${path}.sizeBytes`),
    uploadedAt: assertIsoDate(object.uploadedAt, `${path}.uploadedAt`),
  };
}

function assertApplicationCurriculumUpload(value: unknown, path: string): ApplicationCurriculumUpload {
  const object = assertPlainObject(value, path);
  const summary = assertApplicationCurriculumSummary(object, path);

  return {
    ...summary,
    data: assertBinaryData(object.data, `${path}.data`),
  };
}

function assertApplicationTypeSnapshot(value: unknown, path: string): ApplicationTypeSnapshot {
  const object = assertPlainObject(value, path);

  return {
    code: assertEnum(object.code, applicationTypeCodes, `${path}.code`),
    name: assertString(object.name, `${path}.name`),
  };
}

function assertApplicationChangeActor(value: unknown, path: string): ApplicationChangeActor {
  if (value === null || value === undefined) {
    return null;
  }

  const object = assertPlainObject(value, path);
  const actor: NonNullable<ApplicationChangeActor> = {};

  if (object.userId !== undefined && object.userId !== null) {
    actor.userId = assertString(object.userId, `${path}.userId`);
  }

  if (object.email !== undefined && object.email !== null) {
    actor.email = assertEmail(object.email, `${path}.email`);
  }

  if (object.role !== undefined && object.role !== null) {
    actor.role = assertString(object.role, `${path}.role`);
  }

  return Object.keys(actor).length > 0 ? actor : null;
}

function assertApplicationStatusHistoryEntry(
  value: unknown,
  path: string,
): ApplicationStatusHistoryEntry {
  const object = assertPlainObject(value, path);

  return {
    from:
      object.from === null || object.from === undefined
        ? null
        : assertEnum(object.from, applicationStatuses, `${path}.from`),
    to: assertEnum(object.to, applicationStatuses, `${path}.to`),
    reason: assertNullableString(object.reason, `${path}.reason`),
    changedAt: assertIsoDate(object.changedAt, `${path}.changedAt`),
    changedBy: assertApplicationChangeActor(object.changedBy, `${path}.changedBy`),
  };
}

function assertApplicationStatusHistory(
  value: unknown,
  path: string,
): ApplicationStatusHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value.map((entry, index) =>
    assertApplicationStatusHistoryEntry(entry, `${path}[${index}]`),
  );
}

function assertApplicationTypeHistoryEntry(value: unknown, path: string): ApplicationTypeHistoryEntry {
  const object = assertPlainObject(value, path);

  return {
    from:
      object.from === null || object.from === undefined
        ? null
        : assertApplicationTypeSnapshot(object.from, `${path}.from`),
    to: assertApplicationTypeSnapshot(object.to, `${path}.to`),
    reason: assertNullableString(object.reason, `${path}.reason`),
    changedAt: assertIsoDate(object.changedAt, `${path}.changedAt`),
    changedBy: assertApplicationChangeActor(object.changedBy, `${path}.changedBy`),
  };
}

function assertApplicationTypeHistory(value: unknown, path: string): ApplicationTypeHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value.map((entry, index) => assertApplicationTypeHistoryEntry(entry, `${path}[${index}]`));
}

export function parseApplicationSubmission(
  value: unknown,
  path = "applicationSubmission",
): ApplicationSubmissionInput {
  const object = assertPlainObject(value, path);

  return {
    firstName: assertString(object.firstName, `${path}.firstName`),
    lastName: assertString(object.lastName, `${path}.lastName`),
    email: assertEmail(object.email, `${path}.email`),
    phone: assertString(object.phone, `${path}.phone`),
    nationality: assertString(object.nationality, `${path}.nationality`),
    birthDate: assertIsoDate(object.birthDate, `${path}.birthDate`),
    message: assertOptionalNullableString(object.message, `${path}.message`),
    availability: assertNullableString(object.availability, `${path}.availability`),
    curriculum:
      object.curriculum === null || object.curriculum === undefined
        ? null
        : assertApplicationCurriculumUpload(object.curriculum, `${path}.curriculum`),
  };
}

export function safeParseApplicationSubmission(
  value: unknown,
  path = "applicationSubmission",
): SafeParseResult<ApplicationSubmissionInput> {
  try {
    return { success: true, data: parseApplicationSubmission(value, path) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to parse application submission.",
    };
  }
}

export function parseApplicationStatus(value: unknown, path = "applicationStatus"): ApplicationStatus {
  return assertEnum(value, applicationStatuses, path);
}

export function safeParseApplicationStatus(
  value: unknown,
  path = "applicationStatus",
): SafeParseResult<ApplicationStatus> {
  try {
    return { success: true, data: parseApplicationStatus(value, path) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to parse application status.",
    };
  }
}

export function parseApplication(value: unknown, path = "application"): Application {
  const object = assertPlainObject(value, path);

  return {
    id: assertString(object.id, `${path}.id`),
    firstName: assertString(object.firstName, `${path}.firstName`),
    lastName: assertString(object.lastName, `${path}.lastName`),
    fullName: assertString(object.fullName, `${path}.fullName`),
    email: assertEmail(object.email, `${path}.email`),
    phone: assertString(object.phone, `${path}.phone`),
    nationality: assertString(object.nationality, `${path}.nationality`),
    residenceCountry: assertNullableString(object.residenceCountry, `${path}.residenceCountry`),
    residenceCity: assertNullableString(object.residenceCity, `${path}.residenceCity`),
    birthDate:
      object.birthDate === null || object.birthDate === undefined
        ? null
        : assertIsoDate(object.birthDate, `${path}.birthDate`),
    identityDocument: assertNullableString(object.identityDocument, `${path}.identityDocument`),
    message: assertNullableString(object.message, `${path}.message`),
    availability: assertNullableString(object.availability, `${path}.availability`),
    curriculum:
      object.curriculum === null || object.curriculum === undefined
        ? null
        : assertApplicationCurriculumSummary(object.curriculum, `${path}.curriculum`),
    applicationType: assertApplicationTypeSnapshot(object.applicationType, `${path}.applicationType`),
    applicationTypeHistory: assertApplicationTypeHistory(
      object.applicationTypeHistory,
      `${path}.applicationTypeHistory`,
    ),
    status: assertEnum(object.status, applicationStatuses, `${path}.status`),
    statusHistory: assertApplicationStatusHistory(object.statusHistory, `${path}.statusHistory`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}

export function parseApplicationCollection(value: unknown, path = "applications"): Application[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value.map((entry, index) => parseApplication(entry, `${path}[${index}]`));
}
