import type { CreateHomeHeroVideoInput } from "@/types/home-hero-video";

export const legacyHomeHeroVideoSeeds: Array<Omit<CreateHomeHeroVideoInput, "createdBy" | "updatedBy">> = [
  {
    fileName: "animal.mp4",
    sourceUrl: "/videos/animal.mp4",
    mediaType: "video",
    mimeType: "video/mp4",
    bytes: null,
    displayDurationSeconds: null,
    storageProvider: "local",
    cloudinaryPublicId: null,
    cloudinaryAssetId: null,
  },
  {
    fileName: "nature.mp4",
    sourceUrl: "/videos/nature.mp4",
    mediaType: "video",
    mimeType: "video/mp4",
    bytes: null,
    displayDurationSeconds: null,
    storageProvider: "local",
    cloudinaryPublicId: null,
    cloudinaryAssetId: null,
  },
];
