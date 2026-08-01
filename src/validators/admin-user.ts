import { adminPermissionActions, adminPermissionModules, type AdminPermissionAction, type AdminPermissionKey, type AdminPermissionMatrix, type AdminRole, type AdminUserRecord } from "@/types/admin-user";

function getAdminPermissionActionIndex(action: AdminPermissionAction): number {
  return adminPermissionActions.indexOf(action);
}

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

function normalizeRecordId(value: unknown): string {
  const normalizedString = normalizeString(value);

  if (normalizedString) {
    return normalizedString;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  if ("toHexString" in value && typeof value.toHexString === "function") {
    return normalizeString(value.toHexString());
  }

  if ("toString" in value && typeof value.toString === "function") {
    const normalizedObjectString = normalizeString(value.toString());

    return normalizedObjectString === "[object Object]" ? "" : normalizedObjectString;
  }

  return "";
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

export function normalizeAdminPermissions(value: unknown): AdminPermissionMatrix {
  const rawPermissions = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    adminPermissionModules.map((module) => [module, normalizeModulePermissions(rawPermissions[module])]),
  ) as AdminPermissionMatrix;
}

export function updateAdminPermissionSelection(
  permissions: AdminPermissionMatrix,
  module: keyof AdminPermissionMatrix,
  action: AdminPermissionAction,
  checked: boolean,
): AdminPermissionMatrix {
  const targetActionIndex = getAdminPermissionActionIndex(action);

  return {
    ...permissions,
    [module]: Object.fromEntries(
      adminPermissionActions.map((candidateAction, candidateIndex) => {
        const currentValue = permissions[module][candidateAction];

        if (checked) {
          return [candidateAction, candidateIndex <= targetActionIndex ? true : currentValue];
        }

        return [candidateAction, candidateIndex < targetActionIndex ? currentValue : false];
      }),
    ) as AdminPermissionMatrix[keyof AdminPermissionMatrix],
  };
}

export function areAllAdminPermissionsGranted(permissions: AdminPermissionMatrix): boolean {
  return adminPermissionModules.every((module) =>
    adminPermissionActions.every((action) => permissions[module][action]),
  );
}

export function deriveAdminRoleFromPermissions(permissions: AdminPermissionMatrix): AdminRole {
  return areAllAdminPermissionsGranted(permissions) ? "superadmin" : "admin";
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
  const id = normalizeRecordId(rawRecord.id) || normalizeRecordId(rawRecord._id);
  const createdAt = normalizeDateLike(rawRecord.createdAt, options?.fallbackCreatedAt ?? new Date(0).toISOString());
  const updatedAt = normalizeDateLike(rawRecord.updatedAt, options?.fallbackUpdatedAt ?? createdAt);
  const permissions = normalizeAdminPermissions(rawRecord.permissions);
  const role = deriveAdminRoleFromPermissions(permissions);

  return {
    id,
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
    permissions,
    createdAt,
    updatedAt,
  };
}
