import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import { programCategoryThemes } from "@/types/category";

const programCategorySchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: String,
      enum: programCategoryThemes,
      required: true,
      default: "slate",
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    seedKey: {
      type: String,
      required: false,
      trim: true,
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
    collection: "program_categories",
    timestamps: true,
  },
);

programCategorySchema.index({ order: 1, updatedAt: -1 });
programCategorySchema.index({ code: 1 }, { unique: true });
programCategorySchema.index(
  { seedKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      seedKey: { $type: "string" },
    },
  },
);

export type ProgramCategoryDocument = InferSchemaType<typeof programCategorySchema>;

function createProgramCategoryModel(): Model<ProgramCategoryDocument> {
  if (process.env.NODE_ENV === "production") {
    return (
      (models.ProgramCategory as Model<ProgramCategoryDocument> | undefined) ??
      model<ProgramCategoryDocument>("ProgramCategory", programCategorySchema)
    );
  }

  delete models.ProgramCategory;

  return model<ProgramCategoryDocument>("ProgramCategory", programCategorySchema);
}

export const ProgramCategoryModel = createProgramCategoryModel();
