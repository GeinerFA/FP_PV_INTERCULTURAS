export const homeHeroVideoStorageProviders = ["local", "cloudinary"] as const;
export const homeHeroVideoMediaTypes = ["image", "video"] as const;
export const homeHeroVideoMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"] as const;

export const homeHeroVideoMaxImageFileSizeBytes = 25 * 1024 * 1024;
export const homeHeroVideoMaxVideoFileSizeBytes = 150 * 1024 * 1024;

export type HomeHeroVideoStorageProvider = (typeof homeHeroVideoStorageProviders)[number];
export type HomeHeroVideoMediaType = (typeof homeHeroVideoMediaTypes)[number];
export type HomeHeroVideoMimeType = (typeof homeHeroVideoMimeTypes)[number];

export type HomeHeroVideoRecord = {
  id: string;
  fileName: string;
  sourceUrl: string;
  mediaType: HomeHeroVideoMediaType;
  mimeType: HomeHeroVideoMimeType;
  bytes: number | null;
  displayDurationSeconds: number | null;
  order: number;
  storageProvider: HomeHeroVideoStorageProvider;
  cloudinaryPublicId: string | null;
  cloudinaryAssetId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateHomeHeroVideoInput = {
  fileName: string;
  sourceUrl: string;
  mediaType: HomeHeroVideoMediaType;
  mimeType: HomeHeroVideoMimeType;
  bytes: number | null;
  displayDurationSeconds?: number | null;
  storageProvider: HomeHeroVideoStorageProvider;
  cloudinaryPublicId?: string | null;
  cloudinaryAssetId?: string | null;
  createdBy: string;
  updatedBy: string;
};

export type UpdateHomeHeroVideoOrderInput = {
  id: string;
  order: number;
  displayDurationSeconds?: number | null;
  updatedBy: string;
};

export type DeleteHomeHeroVideoInput = {
  id: string;
};
