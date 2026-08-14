"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
import { createAdminActivityActor, resolveAdminUserActivityLabel } from "@/services/admin/settings-activity";
import {
  AdminUserDuplicateEmailError,
  AdminUserSelfDeleteError,
  deleteAdminUser,
  createAdminUser,
  LastActiveSuperadminError,
  updateAdminUser,
  updateAdminUserActiveState,
} from "@/services/admin-users/admin-user-service";
import { adminPermissionActions, adminPermissionModules, type AdminPermissionMatrix } from "@/types/admin-user";
import { createEmptyAdminPermissions, createFullAdminPermissions, normalizeAdminEmail } from "@/validators/admin-user";

function buildUsersSettingsPath(locale: AppLocale): string {
  return `/${locale}/admin/settings/users`;
}

function buildStatusUrl(path: string, status: string, params?: Record<string, string | undefined>, hash?: string): string {
  const searchParams = new URLSearchParams({ status });

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const normalizedHash = hash ? `#${hash}` : "";

  return `${path}?${searchParams.toString()}${normalizedHash}`;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function hasConfirmedDestructiveIntent(formData: FormData, intent: "delete"): boolean {
  return readString(formData, "destructiveIntent") === intent;
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

function shouldGrantAllPermissions(formData: FormData): boolean {
  return formData.get("grantAllPermissions") === "on";
}

function revalidateUserSettingsPaths(locale: AppLocale): void {
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(buildUsersSettingsPath(locale));
}

export async function createAdminUserAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "users.manage" });
  const permissions = shouldGrantAllPermissions(formData) ? createFullAdminPermissions() : parsePermissions(formData);
  let status = "created";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-user-settings-top";

  try {
    const createdUser = await createAdminUser({
      email: normalizeAdminEmail(readString(formData, "email")),
      fullName: readString(formData, "fullName"),
      nationalId: readString(formData, "nationalId") || null,
      active: formData.get("active") === "on",
      permissions,
    });

    await recordAdminActivitySafely({
      action: "admin_user.created",
      entityType: "admin_user",
      entityId: createdUser.id,
      entityLabel: resolveAdminUserActivityLabel(createdUser),
      actor: createAdminActivityActor(session),
      metadata: {
        adminUserRole: createdUser.role,
      },
      happenedAt: createdUser.updatedAt,
    });

    revalidateUserSettingsPaths(locale);
  } catch (error) {
    if (error instanceof AdminUserDuplicateEmailError) {
      status = "duplicate-email";
      params = { focus: "create" };
      hash = undefined;
    } else {
      status = error instanceof Error ? "invalid" : "save-failed";
      params = { focus: "create" };
      hash = undefined;
    }
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function updateAdminUserAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "users.manage" });
  const active = formData.get("active") === "on";
  let status = "updated";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-user-settings-top";

  try {
    const updatedUser = await updateAdminUser({
      id,
      email: normalizeAdminEmail(readString(formData, "email")),
      fullName: readString(formData, "fullName"),
      nationalId: readString(formData, "nationalId") || null,
      active,
      permissions: parsePermissions(formData),
    });

    if (!updatedUser) {
      status = "save-failed";
      params = { user: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: "admin_user.updated",
        entityType: "admin_user",
        entityId: updatedUser.id,
        entityLabel: resolveAdminUserActivityLabel(updatedUser),
        actor: createAdminActivityActor(session),
        happenedAt: updatedUser.updatedAt,
      });

      revalidateUserSettingsPaths(locale);
    }
  } catch (error) {
    if (error instanceof AdminUserDuplicateEmailError) {
      status = "duplicate-email";
      params = { user: id };
      hash = undefined;
    } else if (error instanceof LastActiveSuperadminError) {
      status = "last-superadmin-protected";
      params = { user: id };
      hash = undefined;
    } else {
      status = error instanceof Error ? "invalid" : "save-failed";
      params = { user: id };
      hash = undefined;
    }
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function toggleAdminUserActiveAction(locale: AppLocale, id: string, active: boolean): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: active ? "users.manage" : "users.delete" });
  let status = active ? "activated" : "deactivated";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-user-settings-top";

  try {
    const updatedUser = await updateAdminUserActiveState(id, active);

    if (!updatedUser) {
      status = "toggle-failed";
      params = { user: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: active ? "admin_user.activated" : "admin_user.deactivated",
        entityType: "admin_user",
        entityId: updatedUser.id,
        entityLabel: resolveAdminUserActivityLabel(updatedUser),
        actor: createAdminActivityActor(session),
        happenedAt: updatedUser.updatedAt,
      });

      revalidateUserSettingsPaths(locale);
    }
  } catch (error) {
    if (error instanceof LastActiveSuperadminError) {
      status = "last-superadmin-protected";
    } else {
      status = "toggle-failed";
    }

    params = { user: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function deleteAdminUserAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildUsersSettingsPath(locale);

  if (!hasConfirmedDestructiveIntent(formData, "delete")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required", { user: id }));
  }

  const session = await requireAdminSession({ locale, nextPath, permission: "users.delete" });
  let status = "deleted";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-user-settings-top";

  try {
    const deletedUser = await deleteAdminUser(id, { actorAdminUserId: session.adminUserId });

    if (!deletedUser) {
      status = "delete-failed";
      params = { user: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: "admin_user.deleted",
        entityType: "admin_user",
        entityId: deletedUser.id,
        entityLabel: resolveAdminUserActivityLabel(deletedUser),
        actor: createAdminActivityActor(session),
        happenedAt: deletedUser.updatedAt,
      });

      revalidateUserSettingsPaths(locale);
    }
  } catch (error) {
    if (error instanceof AdminUserSelfDeleteError) {
      status = "self-delete-blocked";
    } else if (error instanceof LastActiveSuperadminError) {
      status = "last-superadmin-protected";
    } else {
      status = "delete-failed";
    }

    params = { user: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}
