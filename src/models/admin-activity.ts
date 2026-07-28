import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import {
  adminActivityActions,
  adminActivityEntityTypes,
  adminProgramActivityChangeFields,
} from "@/types/admin-activity";
import { applicationStatuses } from "@/types/application";

const adminActivityActorSchema = new Schema(
  {
    displayName: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    role: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false },
);

const adminActivityMetadataSchema = new Schema(
  {
    fromStatus: {
      type: String,
      enum: applicationStatuses,
      default: null,
    },
    slug: {
      type: String,
      trim: true,
      default: null,
    },
    programChanges: {
      type: [
        new Schema(
          {
            field: {
              type: String,
              enum: adminProgramActivityChangeFields,
              required: true,
            },
            from: {
              type: String,
              trim: true,
              default: null,
            },
            to: {
              type: String,
              trim: true,
              default: null,
            },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    toStatus: {
      type: String,
      enum: applicationStatuses,
      default: null,
    },
  },
  { _id: false },
);

const adminActivitySchema = new Schema(
  {
    action: {
      type: String,
      enum: adminActivityActions,
      required: true,
    },
    entityType: {
      type: String,
      enum: adminActivityEntityTypes,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
    },
    entityLabel: {
      type: String,
      required: true,
      trim: true,
    },
    actor: {
      type: adminActivityActorSchema,
      default: null,
    },
    metadata: {
      type: adminActivityMetadataSchema,
      default: null,
    },
    happenedAt: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "activity_logs",
    timestamps: true,
  },
);

adminActivitySchema.index({ happenedAt: -1, createdAt: -1 });
adminActivitySchema.index({ entityType: 1, entityId: 1, happenedAt: -1 });

export type AdminActivityDocument = InferSchemaType<typeof adminActivitySchema>;

function createAdminActivityModel(): Model<AdminActivityDocument> {
  if (process.env.NODE_ENV === "production") {
    return (
      (models.AdminActivity as Model<AdminActivityDocument> | undefined) ??
      model<AdminActivityDocument>("AdminActivity", adminActivitySchema)
    );
  }

  delete models.AdminActivity;

  return model<AdminActivityDocument>("AdminActivity", adminActivitySchema);
}

export const AdminActivityModel = createAdminActivityModel();
