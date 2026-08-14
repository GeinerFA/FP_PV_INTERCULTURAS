import {
  adminActivityActions,
  adminActivityEntityTypes,
  adminProgramActivityChangeFields,
  type AdminActivityAction,
  type AdminActivityActor,
  type AdminActivityLog,
  type AdminActivityMetadata,
  type AdminProgramActivityChange,
  type AdminProgramActivityChangeField,
  type AdminActivityEntityType,
  type CreateAdminActivityLogInput,
} from "@/types/admin-activity";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";
import { adminRoles, type AdminRole } from "@/types/admin-user";

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

function assertOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function assertNullableOptionalString(value: unknown, path: string): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${path} must be a string, null, or undefined.`);
  }

  return value.trim();
}

function assertIsoDate(value: unknown, path: string): string {
  const isoDate = assertString(value, path);

  if (Number.isNaN(Date.parse(isoDate))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return new Date(isoDate).toISOString();
}

function assertPositiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return value;
}

function assertAction(value: unknown, path: string): AdminActivityAction {
  if (typeof value !== "string" || !adminActivityActions.includes(value as AdminActivityAction)) {
    throw new Error(`${path} must be one of: ${adminActivityActions.join(", ")}.`);
  }

  return value as AdminActivityAction;
}

function assertEntityType(value: unknown, path: string): AdminActivityEntityType {
  if (typeof value !== "string" || !adminActivityEntityTypes.includes(value as AdminActivityEntityType)) {
    throw new Error(`${path} must be one of: ${adminActivityEntityTypes.join(", ")}.`);
  }

  return value as AdminActivityEntityType;
}

function assertApplicationStatus(value: unknown, path: string): ApplicationStatus {
  if (typeof value !== "string" || !applicationStatuses.includes(value as ApplicationStatus)) {
    throw new Error(`${path} must be one of: ${applicationStatuses.join(", ")}.`);
  }

  return value as ApplicationStatus;
}

function assertAdminRole(value: unknown, path: string): AdminRole {
  if (typeof value !== "string" || !adminRoles.includes(value as AdminRole)) {
    throw new Error(`${path} must be one of: ${adminRoles.join(", ")}.`);
  }

  return value as AdminRole;
}

function assertProgramActivityChangeField(value: unknown, path: string): AdminProgramActivityChangeField {
  if (
    typeof value !== "string" ||
    !adminProgramActivityChangeFields.includes(value as AdminProgramActivityChangeField)
  ) {
    throw new Error(`${path} must be one of: ${adminProgramActivityChangeFields.join(", ")}.`);
  }

  return value as AdminProgramActivityChangeField;
}

function parseProgramChanges(value: unknown, path: string): AdminProgramActivityChange[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value.map((entry, index) => {
    const object = assertPlainObject(entry, `${path}[${index}]`);

    return {
      field: assertProgramActivityChangeField(object.field, `${path}[${index}].field`),
      from: assertNullableOptionalString(object.from, `${path}[${index}].from`),
      to: assertNullableOptionalString(object.to, `${path}[${index}].to`),
    };
  });
}

function parseActor(value: unknown, path: string): AdminActivityActor {
  if (value === null || value === undefined) {
    return null;
  }

  const object = assertPlainObject(value, path);
  const actor: NonNullable<AdminActivityActor> = {};

  const displayName = assertOptionalString(object.displayName);
  const email = assertOptionalString(object.email)?.toLowerCase();
  const role = assertOptionalString(object.role);

  if (displayName) {
    actor.displayName = displayName;
  }

  if (email) {
    actor.email = email;
  }

  if (role) {
    actor.role = role;
  }

  return Object.keys(actor).length > 0 ? actor : null;
}

function parseMetadata(value: unknown, path: string): AdminActivityMetadata | null {
  if (value === null || value === undefined) {
    return null;
  }

  const object = assertPlainObject(value, path);
  const metadata: AdminActivityMetadata = {};

  if (object.adminUserRole === null) {
    metadata.adminUserRole = null;
  } else if (object.adminUserRole !== undefined) {
    metadata.adminUserRole = assertAdminRole(object.adminUserRole, `${path}.adminUserRole`);
  }

  if (object.fromStatus === null) {
    metadata.fromStatus = null;
  } else if (object.fromStatus !== undefined) {
    metadata.fromStatus = assertApplicationStatus(object.fromStatus, `${path}.fromStatus`);
  }

  if (object.fromPosition === null) {
    metadata.fromPosition = null;
  } else if (object.fromPosition !== undefined) {
    metadata.fromPosition = assertPositiveInteger(object.fromPosition, `${path}.fromPosition`);
  }

  if (object.toStatus === null) {
    metadata.toStatus = null;
  } else if (object.toStatus !== undefined) {
    metadata.toStatus = assertApplicationStatus(object.toStatus, `${path}.toStatus`);
  }

  if (object.toPosition === null) {
    metadata.toPosition = null;
  } else if (object.toPosition !== undefined) {
    metadata.toPosition = assertPositiveInteger(object.toPosition, `${path}.toPosition`);
  }

  if (object.slug === null) {
    metadata.slug = null;
  } else {
    metadata.slug = assertOptionalString(object.slug) ?? undefined;
  }

  const programChanges = parseProgramChanges(object.programChanges, `${path}.programChanges`);

  if (programChanges && programChanges.length > 0) {
    metadata.programChanges = programChanges;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

export function parseCreateAdminActivityLogInput(
  value: unknown,
  path = "createAdminActivityLogInput",
): CreateAdminActivityLogInput {
  const object = assertPlainObject(value, path);

  return {
    action: assertAction(object.action, `${path}.action`),
    entityType: assertEntityType(object.entityType, `${path}.entityType`),
    entityId: assertString(object.entityId, `${path}.entityId`),
    entityLabel: assertString(object.entityLabel, `${path}.entityLabel`),
    actor: parseActor(object.actor, `${path}.actor`) ?? undefined,
    metadata: parseMetadata(object.metadata, `${path}.metadata`),
    happenedAt:
      object.happenedAt === undefined || object.happenedAt === null
        ? undefined
        : assertIsoDate(object.happenedAt, `${path}.happenedAt`),
  };
}

export function parseAdminActivityLog(value: unknown, path = "adminActivityLog"): AdminActivityLog {
  const object = assertPlainObject(value, path);

  return {
    id: assertString(object.id, `${path}.id`),
    action: assertAction(object.action, `${path}.action`),
    entityType: assertEntityType(object.entityType, `${path}.entityType`),
    entityId: assertString(object.entityId, `${path}.entityId`),
    entityLabel: assertString(object.entityLabel, `${path}.entityLabel`),
    actor: parseActor(object.actor, `${path}.actor`),
    metadata: parseMetadata(object.metadata, `${path}.metadata`),
    happenedAt: assertIsoDate(object.happenedAt, `${path}.happenedAt`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}
