"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import {
  AdminUserDuplicateEmailError,
  createAdminPermissionsForRole,
  createAdminUser,
  LastActiveSuperadminError,
  updateAdminUser,
  updateAdminUserActiveState,
} from "@/services/admin-users/admin-user-service";
import { adminPermissionActions, adminPermissionModules, adminRoles, type AdminPermissionMatrix, type AdminRole } from "@/types/admin-user";
import { createEmptyAdminPermissions, normalizeAdminEmail } from "@/validators/admin-user";

function buildUsersSettingsPath(locale: AppLocale): string {
  return `/${locale}/admin/settings/users`;
}

function buildStatusUrl(path: string, status: string): string {
  return `${path}?status=${encodeURIComponent(status)}`;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseRole(value: string): AdminRole {
  return adminRoles.includes(value as AdminRole) ? (value as AdminRole) : "admin";
}

function parsePermissions(formData: FormData): AdminPermissionMatrix {
  const permissions = createEmptyAdminPermissions();

  for (const adminModule of adminPermissionModules) {
    for (const action of adminPermissionActions) {
      permissions[adminModule][action] = formData.get(`permissions.${adminModule}.${action}`) === "on";
    }
  }

  return permissions;
}

function revalidateUserSettingsPaths(locale: AppLocale): void {
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(buildUsersSettingsPath(locale));
}

export async function createAdminUserAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  await requireAdminSession({ locale, nextPath, permission: "users.manage" });
  const role = parseRole(readString(formData, "role"));

  try {
    await createAdminUser({
      email: normalizeAdminEmail(readString(formData, "email")),
      fullName: readString(formData, "fullName"),
      nationalId: readString(formData, "nationalId") || null,
      active: formData.get("active") === "on",
      role,
      permissions: createAdminPermissionsForRole(role, parsePermissions(formData)),
    });

    revalidateUserSettingsPaths(locale);
    redirect(buildStatusUrl(nextPath, "created"));
  } catch (error) {
    if (error instanceof AdminUserDuplicateEmailError) {
      redirect(buildStatusUrl(nextPath, "duplicate-email"));
    }

    redirect(buildStatusUrl(nextPath, error instanceof Error ? "invalid" : "save-failed"));
  }
}

export async function updateAdminUserAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  await requireAdminSession({ locale, nextPath, permission: "users.manage" });
  const role = parseRole(readString(formData, "role"));
  const active = formData.get("active") === "on";

  try {
    const updatedUser = await updateAdminUser({
      id,
      email: normalizeAdminEmail(readString(formData, "email")),
      fullName: readString(formData, "fullName"),
      nationalId: readString(formData, "nationalId") || null,
      active,
      role,
      permissions: createAdminPermissionsForRole(role, parsePermissions(formData)),
    });

    if (!updatedUser) {
      redirect(buildStatusUrl(nextPath, "save-failed"));
    }

    revalidateUserSettingsPaths(locale);
    redirect(buildStatusUrl(nextPath, "updated"));
  } catch (error) {
    if (error instanceof AdminUserDuplicateEmailError) {
      redirect(buildStatusUrl(nextPath, "duplicate-email"));
    }

    if (error instanceof LastActiveSuperadminError) {
      redirect(buildStatusUrl(nextPath, "last-superadmin-protected"));
    }

    redirect(buildStatusUrl(nextPath, error instanceof Error ? "invalid" : "save-failed"));
  }
}

export async function toggleAdminUserActiveAction(locale: AppLocale, id: string, active: boolean): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  await requireAdminSession({ locale, nextPath, permission: active ? "users.manage" : "users.delete" });

  try {
    const updatedUser = await updateAdminUserActiveState(id, active);

    if (!updatedUser) {
      redirect(buildStatusUrl(nextPath, "toggle-failed"));
    }

    revalidateUserSettingsPaths(locale);
    redirect(buildStatusUrl(nextPath, active ? "activated" : "deactivated"));
  } catch (error) {
    if (error instanceof LastActiveSuperadminError) {
      redirect(buildStatusUrl(nextPath, "last-superadmin-protected"));
    }

    redirect(buildStatusUrl(nextPath, "toggle-failed"));
  }
}
