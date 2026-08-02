import type {
  CreateHomeHeroVideoInput,
  DeleteHomeHeroVideoInput,
  HomeHeroVideoRecord,
  UpdateHomeHeroVideoOrderInput,
} from "@/types/home-hero-video";
import { parseHomeHeroVideoCreateInput } from "@/validators/home-hero-video";

import { deleteCloudinaryAsset } from "@/lib/cloudinary";

import { getHomeHeroVideoRepository } from "./home-hero-video-repository";
import { legacyHomeHeroVideoSeeds } from "./home-hero-video-source";

type DeleteHomeHeroVideoDependencies = {
  deleteCloudinaryAsset: typeof deleteCloudinaryAsset;
  logger: Pick<Console, "error">;
  repository: Pick<ReturnType<typeof getHomeHeroVideoRepository>, "delete" | "findById">;
};

function getDeleteHomeHeroVideoDependencies(): DeleteHomeHeroVideoDependencies {
    return {
    deleteCloudinaryAsset,
    logger: console,
    repository: getHomeHeroVideoRepository(),
  };
}

function isRecoverablePublicHomeHeroVideoReadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "MongooseServerSelectionError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoParseError" ||
    error.message.includes("MONGODB_URI environment variable is required") ||
    error.message.includes("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number")
  );
}

function buildPublicFallbackEntries(): HomeHeroVideoRecord[] {
  const now = new Date(0).toISOString();

  return legacyHomeHeroVideoSeeds.map((entry, index) => ({
    id: `legacy-home-hero-video-${index + 1}`,
      fileName: entry.fileName,
      sourceUrl: entry.sourceUrl,
      mediaType: entry.mediaType,
      mimeType: entry.mimeType,
      bytes: entry.bytes,
      displayDurationSeconds: entry.displayDurationSeconds ?? null,
      order: index + 1,
    storageProvider: entry.storageProvider,
    cloudinaryPublicId: entry.cloudinaryPublicId ?? null,
    cloudinaryAssetId: entry.cloudinaryAssetId ?? null,
    createdBy: "legacy-bootstrap",
    updatedBy: "legacy-bootstrap",
    createdAt: now,
    updatedAt: now,
  }));
}

export async function listPublicHomeHeroVideos(): Promise<HomeHeroVideoRecord[]> {
  try {
    return await getHomeHeroVideoRepository().list({ seedBootstrap: true });
  } catch (error) {
    if (!isRecoverablePublicHomeHeroVideoReadError(error)) {
      throw error;
    }

    console.error("[home-hero-video-service] listPublicHomeHeroVideos fallback", error);
    return buildPublicFallbackEntries();
  }
}

export async function listAdminHomeHeroVideos(): Promise<HomeHeroVideoRecord[]> {
  return getHomeHeroVideoRepository().list({ seedBootstrap: true });
}

export async function createAdminHomeHeroVideo(input: CreateHomeHeroVideoInput): Promise<HomeHeroVideoRecord> {
  return getHomeHeroVideoRepository().create(input);
}

export async function createAdminHomeHeroVideoFromUpload(
  input: Omit<CreateHomeHeroVideoInput, "createdBy" | "updatedBy" | "storageProvider" | "sourceUrl" | "mimeType" | "bytes"> & {
    bytes: number;
    cloudinaryPublicId: string;
    cloudinaryAssetId: string;
    createdBy: string;
    mediaType: CreateHomeHeroVideoInput["mediaType"];
    mimeType: CreateHomeHeroVideoInput["mimeType"];
    sourceUrl: string;
    updatedBy: string;
  },
): Promise<HomeHeroVideoRecord> {
  const parsedInput = parseHomeHeroVideoCreateInput({
    ...input,
    storageProvider: "cloudinary",
  });

  return createAdminHomeHeroVideo({
    ...parsedInput,
    storageProvider: "cloudinary",
    createdBy: input.createdBy,
    updatedBy: input.updatedBy,
  });
}

export async function updateAdminHomeHeroVideoOrder(input: UpdateHomeHeroVideoOrderInput): Promise<HomeHeroVideoRecord[] | null> {
  return getHomeHeroVideoRepository().updateOrder(input);
}

export async function deleteAdminHomeHeroVideo(
  input: DeleteHomeHeroVideoInput,
  dependencies: DeleteHomeHeroVideoDependencies = getDeleteHomeHeroVideoDependencies(),
): Promise<HomeHeroVideoRecord | null> {
  const { deleteCloudinaryAsset, logger, repository } = dependencies;
  const existingVideo = await repository.findById(input.id, { seedBootstrap: true });

  if (!existingVideo) {
    return null;
  }

  const deletedVideo = await repository.delete(input);

  if (!deletedVideo) {
    return null;
  }

  if (deletedVideo.storageProvider === "cloudinary" && deletedVideo.cloudinaryPublicId) {
    try {
      await deleteCloudinaryAsset(deletedVideo.cloudinaryPublicId, deletedVideo.mediaType);
    } catch (error) {
      logger.error("[home-hero-video-service] Cloudinary cleanup failed after record deletion", {
        error,
        publicId: deletedVideo.cloudinaryPublicId,
        videoId: deletedVideo.id,
      });
    }
  }

  return deletedVideo;
}
