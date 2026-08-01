export const adminRoles = ["superadmin", "admin"] as const;
export const adminPermissionModules = ["dashboard", "programs", "applications", "activity", "settings", "users"] as const;
export const adminPermissionActions = ["view", "manage", "delete"] as const;

export type AdminRole = (typeof adminRoles)[number];
export type AdminPermissionModule = (typeof adminPermissionModules)[number];
export type AdminPermissionAction = (typeof adminPermissionActions)[number];
export type AdminPermissionKey = `${AdminPermissionModule}.${AdminPermissionAction}`;

export type AdminModulePermissions = Record<AdminPermissionAction, boolean>;
export type AdminPermissionMatrix = Record<AdminPermissionModule, AdminModulePermissions>;

export type AdminUserRecord = {
  id: string;
  email: string;
  fullName: string;
  nationalId: string | null;
  active: boolean;
  role: AdminRole;
  permissions: AdminPermissionMatrix;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserInput = {
  email: string;
  fullName: string;
  nationalId?: string | null;
  active?: boolean;
  permissions: AdminPermissionMatrix;
};

export type UpdateAdminUserInput = {
  id: string;
  email: string;
  fullName: string;
  nationalId?: string | null;
  active: boolean;
  permissions: AdminPermissionMatrix;
};

export type AdminUserBootstrapInput = {
  email: string;
  fullName?: string | null;
  nationalId?: string | null;
};
