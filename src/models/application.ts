import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import { applicationStatuses, applicationTypeCodes } from "@/types/application";

const applicationTypeSnapshotSchema = new Schema(
  {
    code: {
      type: String,
      enum: applicationTypeCodes,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const applicationChangeActorSchema = new Schema(
  {
    userId: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const applicationStatusHistoryEntrySchema = new Schema(
  {
    from: {
      type: String,
      enum: applicationStatuses,
      default: null,
    },
    to: {
      type: String,
      enum: applicationStatuses,
      required: true,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    changedAt: {
      type: Date,
      required: true,
    },
    changedBy: {
      type: applicationChangeActorSchema,
      default: null,
    },
  },
  { _id: false },
);

const applicationTypeHistoryEntrySchema = new Schema(
  {
    from: {
      type: applicationTypeSnapshotSchema,
      default: null,
    },
    to: {
      type: applicationTypeSnapshotSchema,
      required: true,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    changedAt: {
      type: Date,
      required: true,
    },
    changedBy: {
      type: applicationChangeActorSchema,
      default: null,
    },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    residenceCountry: {
      type: String,
      default: null,
      trim: true,
    },
    residenceCity: {
      type: String,
      default: null,
      trim: true,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    identityDocument: {
      type: String,
      default: null,
      trim: true,
    },
    message: {
      type: String,
      default: null,
      trim: true,
    },
    availability: {
      type: String,
      default: null,
      trim: true,
    },
    applicationType: {
      type: applicationTypeSnapshotSchema,
      required: true,
    },
    applicationTypeHistory: {
      type: [applicationTypeHistoryEntrySchema],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: applicationStatuses,
      required: true,
    },
    statusHistory: {
      type: [applicationStatusHistoryEntrySchema],
      required: true,
      default: [],
    },
  },
  {
    collection: "applications",
    timestamps: true,
  },
);

applicationSchema.index({ status: 1, createdAt: -1 });

export type ApplicationDocument = InferSchemaType<typeof applicationSchema>;

function createApplicationModel(): Model<ApplicationDocument> {
  if (process.env.NODE_ENV === "production") {
    return (
      (models.Application as Model<ApplicationDocument> | undefined) ??
      model<ApplicationDocument>("Application", applicationSchema)
    );
  }

  delete models.Application;

  return model<ApplicationDocument>("Application", applicationSchema);
}

export const ApplicationModel = createApplicationModel();
