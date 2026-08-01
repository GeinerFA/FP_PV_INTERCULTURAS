import type { AdminRole, AdminUserRecord, CreateAdminUserInput, UpdateAdminUserInput } from "@/types/admin-user";
import { deriveAdminRoleFromPermissions, hasPermission, normalizeAdminEmail, normalizeAdminPermissions } from "@/validators/admin-user";

import { getAdminUserRepository } from "./admin-user-repository";

export class AdminUserDuplicateEmailError extends Error {
  constructor() {
    super("Another admin user already uses this email.");
  }
}

export class LastActiveSuperadminError extends Error {
  constructor() {
    super("The last active superadmin cannot lose access.");
  }
}

function isDuplicateMongoError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number" &&
      (error as { code: number }).code === 11000,
  );
}

function assertRequiredText(value: string, path: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${path} is required.`);
  }

  return normalized;
}

function buildBootstrapFullName(email: string, providedFullName?: string | null): string {
  const normalizedFullName = providedFullName?.trim();

  if (normalizedFullName) {
    return normalizedFullName;
  }

  const [localPart] = email.split("@");

  return localPart || email;
}

type NormalizedCreateAdminUserInput = CreateAdminUserInput & {
  active: boolean;
  role: AdminRole;
};

type NormalizedUpdateAdminUserInput = UpdateAdminUserInput & {
  role: AdminRole;
};

function buildNormalizedMutableFields(input: Pick<CreateAdminUserInput | UpdateAdminUserInput, "email" | "fullName" | "nationalId" | "permissions">) {
  const permissions = normalizeAdminPermissions(input.permissions);

  return {
    email: normalizeAdminEmail(assertRequiredText(input.email, "email")),
    fullName: assertRequiredText(input.fullName, "fullName"),
    nationalId: input.nationalId?.trim() || null,
    permissions,
    role: deriveAdminRoleFromPermissions(permissions),
  };
}

async function assertUniqueEmail(email: string, currentId?: string): Promise<void> {
  const existing = await getAdminUserRepository().findByEmail(email);

  if (existing && existing.id !== currentId) {
    throw new AdminUserDuplicateEmailError();
  }
}

async function assertSuperadminSafety(currentUser: AdminUserRecord, nextUser: { email: string; active: boolean; role: AdminRole }): Promise<void> {
  if (currentUser.role !== "superadmin" || !currentUser.active) {
    return;
  }

  const losesSuperadminAccess = !nextUser.active || nextUser.role !== "superadmin" || normalizeAdminEmail(currentUser.email) !== normalizeAdminEmail(nextUser.email);

  if (!losesSuperadminAccess) {
    return;
  }

  const otherActiveSuperadmins = await getAdminUserRepository().countActiveSuperadmins(currentUser.id);

  if (otherActiveSuperadmins === 0) {
    throw new LastActiveSuperadminError();
  }
}

function normalizeCreateAdminUserInput(input: CreateAdminUserInput): NormalizedCreateAdminUserInput {
  return {
    ...input,
    active: input.active ?? true,
    ...buildNormalizedMutableFields(input),
  };
}

function normalizeUpdateAdminUserInput(input: UpdateAdminUserInput): NormalizedUpdateAdminUserInput {
  return {
    ...input,
    ...buildNormalizedMutableFields(input),
  };
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  return getAdminUserRepository().list();
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRecord | null> {
  return getAdminUserRepository().findByEmail(email);
}

export async function ensureBootstrapSuperadmin(identity: {
  email: string;
  fullName?: string | null;
  nationalId?: string | null;
}): Promise<AdminUserRecord | null> {
  const normalizedEmail = normalizeAdminEmail(identity.email);
  const allowedEmail = normalizeAdminEmail(process.env.ADMIN_ALLOWED_EMAIL);

  if (!normalizedEmail || !allowedEmail || normalizedEmail !== allowedEmail) {
    return null;
  }

  const existing = await getAdminUserRepository().findByEmail(normalizedEmail);

  if (existing) {
    return existing;
  }

  try {
    return await getAdminUserRepository().bootstrapSuperadmin({
      email: normalizedEmail,
      fullName: buildBootstrapFullName(normalizedEmail, identity.fullName),
      nationalId: identity.nationalId ?? null,
    });
  } catch (error) {
    if (isDuplicateMongoError(error)) {
      return getAdminUserRepository().findByEmail(normalizedEmail);
    }

    throw error;
  }
}

export async function resolveAuthorizedAdminUserByEmail(identity: {
  email: string;
  fullName?: string | null;
  nationalId?: string | null;
}): Promise<AdminUserRecord | null> {
  const normalizedEmail = normalizeAdminEmail(identity.email);

  if (!normalizedEmail) {
    return null;
  }

  const bootstrappedOrExisting = await ensureBootstrapSuperadmin(identity);
  const adminUser = bootstrappedOrExisting ?? (await getAdminUserRepository().findByEmail(normalizedEmail));

  if (!adminUser || !adminUser.active) {
    return null;
  }

  return adminUser;
}

export function adminHasPermission(adminUser: Pick<AdminUserRecord, "permissions" | "role">, permission: Parameters<typeof hasPermission>[1]): boolean {
  return adminUser.role === "superadmin" || hasPermission(adminUser.permissions, permission);
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUserRecord> {
  const normalizedInput = normalizeCreateAdminUserInput(input);

  await assertUniqueEmail(normalizedInput.email);

  try {
    return await getAdminUserRepository().create(normalizedInput);
  } catch (error) {
    if (isDuplicateMongoError(error)) {
      throw new AdminUserDuplicateEmailError();
    }

    throw error;
  }
}

export async function updateAdminUser(input: UpdateAdminUserInput): Promise<AdminUserRecord | null> {
  const currentUser = await getAdminUserRepository().findById(input.id);

  if (!currentUser) {
    return null;
  }

  const normalizedInput = normalizeUpdateAdminUserInput(input);

  await assertUniqueEmail(normalizedInput.email, currentUser.id);
  await assertSuperadminSafety(currentUser, normalizedInput);

  try {
    return await getAdminUserRepository().update(normalizedInput);
  } catch (error) {
    if (isDuplicateMongoError(error)) {
      throw new AdminUserDuplicateEmailError();
    }

    throw error;
  }
}

export async function updateAdminUserActiveState(id: string, active: boolean): Promise<AdminUserRecord | null> {
  const currentUser = await getAdminUserRepository().findById(id);

  if (!currentUser) {
    return null;
  }

  await assertSuperadminSafety(currentUser, { email: currentUser.email, active, role: currentUser.role });

  return getAdminUserRepository().update({
    ...currentUser,
    active,
  });
}
