import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

import { homeHeroVideoMediaTypes, homeHeroVideoMimeTypes, homeHeroVideoStorageProviders } from "@/types/home-hero-video";

const homeHeroVideoSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: homeHeroVideoMediaTypes,
      required: true,
      default: "video",
    },
    mimeType: {
      type: String,
      enum: homeHeroVideoMimeTypes,
      required: true,
      default: "video/mp4",
    },
    bytes: {
      type: Number,
      required: false,
      min: 1,
    },
    displayDurationSeconds: {
      type: Number,
      required: false,
      min: 1,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    storageProvider: {
      type: String,
      enum: homeHeroVideoStorageProviders,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: false,
      trim: true,
    },
    cloudinaryAssetId: {
      type: String,
      required: false,
      trim: true,
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
    collection: "home_hero_videos",
    timestamps: true,
  },
);

homeHeroVideoSchema.index({ order: 1, updatedAt: -1 });
homeHeroVideoSchema.index(
  { cloudinaryPublicId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      cloudinaryPublicId: { $type: "string" },
    },
  },
);
homeHeroVideoSchema.index(
  { cloudinaryAssetId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      cloudinaryAssetId: { $type: "string" },
    },
  },
);
homeHeroVideoSchema.index(
  { seedKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      seedKey: { $type: "string" },
    },
  },
);

export type HomeHeroVideoDocument = InferSchemaType<typeof homeHeroVideoSchema>;

function createHomeHeroVideoModel(): Model<HomeHeroVideoDocument> {
  if (process.env.NODE_ENV === "production") {
    return (
      (models.HomeHeroVideo as Model<HomeHeroVideoDocument> | undefined) ??
      model<HomeHeroVideoDocument>("HomeHeroVideo", homeHeroVideoSchema)
    );
  }

  delete models.HomeHeroVideo;

  return model<HomeHeroVideoDocument>("HomeHeroVideo", homeHeroVideoSchema);
}

export const HomeHeroVideoModel = createHomeHeroVideoModel();
