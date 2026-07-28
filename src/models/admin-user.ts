import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import { adminPermissionActions, adminPermissionModules, adminRoles } from "@/types/admin-user";

const modulePermissionsSchema = new Schema(
  Object.fromEntries(adminPermissionActions.map((action) => [action, { type: Boolean, required: true, default: false }])),
  { _id: false },
);

const adminUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nationalId: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    role: {
      type: String,
      enum: adminRoles,
      required: true,
      default: "admin",
    },
    permissions: {
      type: new Schema(
        Object.fromEntries(adminPermissionModules.map((module) => [module, { type: modulePermissionsSchema, required: true }])),
        { _id: false },
      ),
      required: true,
    },
  },
  {
    collection: "admin_users",
    timestamps: true,
  },
);

adminUserSchema.index({ email: 1 }, { unique: true });
adminUserSchema.index({ role: 1, active: 1 });

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;

function createAdminUserModel(): Model<AdminUserDocument> {
  if (process.env.NODE_ENV === "production") {
    return (models.AdminUser as Model<AdminUserDocument> | undefined) ?? model<AdminUserDocument>("AdminUser", adminUserSchema);
  }

  delete models.AdminUser;

  return model<AdminUserDocument>("AdminUser", adminUserSchema);
}

export const AdminUserModel = createAdminUserModel();
