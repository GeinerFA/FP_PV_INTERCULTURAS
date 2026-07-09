import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import { locales } from "@/config/i18n";
import { programCategories, programStatuses } from "@/types/program";

const localizedTextSchemaDefinition = Object.fromEntries(
  locales.map((locale) => [
    locale,
    {
      type: String,
      trim: true,
      default: "",
    },
  ]),
);

const localizedTextSchema = new Schema(localizedTextSchemaDefinition, { _id: false });

const programTranslationSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    fullDescription: {
      type: String,
      trim: true,
      default: "",
    },
    requirements: {
      type: [String],
      required: true,
      default: [],
    },
    included: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { _id: false },
);

const programSeoEntrySchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const translationsSchemaDefinition = Object.fromEntries(
  locales.map((locale) => [locale, { type: programTranslationSchema, required: true }]),
);

const seoSchemaDefinition = Object.fromEntries(
  locales.map((locale) => [locale, { type: programSeoEntrySchema, required: true }]),
);

const programSnapshotSchema = new Schema(
  {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    category: {
      type: String,
      enum: programCategories,
      required: true,
    },
    featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: localizedTextSchema,
      required: true,
    },
    duration: {
      type: localizedTextSchema,
      required: true,
    },
    availability: {
      type: localizedTextSchema,
      required: true,
    },
    translations: {
      type: new Schema(translationsSchemaDefinition, { _id: false }),
      required: true,
    },
    seo: {
      type: new Schema(seoSchemaDefinition, { _id: false }),
      required: true,
    },
  },
  { _id: false },
);

const programSchema = new Schema(
  {
    workflowState: {
      type: String,
      enum: programStatuses,
      required: true,
      default: "draft",
    },
    draftSnapshot: {
      type: programSnapshotSchema,
      required: true,
    },
    publishedSnapshot: {
      type: programSnapshotSchema,
      default: null,
    },
    firstPublishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "programs",
    timestamps: true,
  },
);

programSchema.index({ workflowState: 1, updatedAt: -1 });
programSchema.index({ "draftSnapshot.slug": 1 }, { unique: true });
programSchema.index({ "publishedSnapshot.slug": 1 });

export type ProgramDocument = InferSchemaType<typeof programSchema>;

function createProgramModel(): Model<ProgramDocument> {
  if (process.env.NODE_ENV === "production") {
    return (
      (models.Program as Model<ProgramDocument> | undefined) ??
      model<ProgramDocument>("Program", programSchema)
    );
  }

  delete models.Program;

  return model<ProgramDocument>("Program", programSchema);
}

export const ProgramModel = createProgramModel();
