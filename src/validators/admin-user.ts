import {
  adminPermissionModules,
  adminRoles,
  type AdminPermissionAction,
  type AdminPermissionKey,
  type AdminPermissionMatrix,
  type AdminRole,
  type AdminUserRecord,
} from "@/types/admin-user";

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);

  return normalized.length > 0 ? normalized : null;
}

function normalizeDateLike(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
}

function parseRole(value: unknown): AdminRole {
  return adminRoles.includes(value as AdminRole) ? (value as AdminRole) : "admin";
}

function normalizeModulePermissions(value: unknown) {
  const rawPermissions = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const view = normalizeBoolean(rawPermissions.view);
  const manage = normalizeBoolean(rawPermissions.manage);
  const canDelete = normalizeBoolean(rawPermissions.delete);

  return {
    view: view || manage || canDelete,
    manage: manage || canDelete,
    delete: canDelete,
  } satisfies Record<AdminPermissionAction, boolean>;
}

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function createEmptyAdminPermissions(): AdminPermissionMatrix {
  return Object.fromEntries(
    adminPermissionModules.map((module) => [module, { view: false, manage: false, delete: false }]),
  ) as AdminPermissionMatrix;
}

export function createFullAdminPermissions(): AdminPermissionMatrix {
  return Object.fromEntries(
    adminPermissionModules.map((module) => [module, { view: true, manage: true, delete: true }]),
  ) as AdminPermissionMatrix;
}

export function normalizeAdminPermissions(value: unknown, role: AdminRole): AdminPermissionMatrix {
  if (role === "superadmin") {
    return createFullAdminPermissions();
  }

  const rawPermissions = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    adminPermissionModules.map((module) => [module, normalizeModulePermissions(rawPermissions[module])]),
  ) as AdminPermissionMatrix;
}

export function hasPermission(permissions: AdminPermissionMatrix, permission: AdminPermissionKey): boolean {
  const [module, action] = permission.split(".") as [keyof AdminPermissionMatrix, AdminPermissionAction];

  return Boolean(permissions[module]?.[action]);
}

export function parseAdminUserRecord(
  value: unknown,
  options?: {
    fallbackCreatedAt?: string;
    fallbackUpdatedAt?: string;
  },
): AdminUserRecord {
  const rawRecord = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const role = parseRole(rawRecord.role);
  const createdAt = normalizeDateLike(rawRecord.createdAt, options?.fallbackCreatedAt ?? new Date(0).toISOString());
  const updatedAt = normalizeDateLike(rawRecord.updatedAt, options?.fallbackUpdatedAt ?? createdAt);

  return {
    id: normalizeString(rawRecord.id ?? rawRecord._id),
    email: normalizeAdminEmail(normalizeString(rawRecord.email)),
    fullName:
      normalizeString(rawRecord.fullName) ||
      normalizeString(rawRecord.name) ||
      normalizeString(rawRecord.displayName) ||
      normalizeAdminEmail(normalizeString(rawRecord.email)),
    nationalId:
      normalizeOptionalString(rawRecord.nationalId) ??
      normalizeOptionalString(rawRecord.nationalID) ??
      normalizeOptionalString(rawRecord.idNumber) ??
      normalizeOptionalString(rawRecord.cedula),
    active: rawRecord.active === undefined ? true : normalizeBoolean(rawRecord.active),
    role,
    permissions: normalizeAdminPermissions(rawRecord.permissions, role),
    createdAt,
    updatedAt,
  };
}
