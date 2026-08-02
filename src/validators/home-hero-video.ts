import {
  homeHeroVideoMaxImageFileSizeBytes,
  homeHeroVideoMaxVideoFileSizeBytes,
  homeHeroVideoMediaTypes,
  homeHeroVideoMimeTypes,
  homeHeroVideoStorageProviders,
  type CreateHomeHeroVideoInput,
  type HomeHeroVideoMediaType,
  type HomeHeroVideoMimeType,
  type HomeHeroVideoRecord,
  type HomeHeroVideoStorageProvider,
} from "@/types/home-hero-video";

type PlainObject = Record<string, unknown>;

function assertPlainObject(value: unknown, path: string): PlainObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }

  return value as PlainObject;
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value.trim();
}

function assertNullableString(value: unknown, path: string): string | null {
  if (value == null || value === "") {
    return null;
  }

  return assertString(value, path);
}

function assertPositiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return value;
}

function assertNullableFileSize(value: unknown, path: string, maxBytes: number): number | null {
  if (value == null) {
    return null;
  }

  const size = assertPositiveInteger(value, path);

  if (size > maxBytes) {
    throw new Error(`${path} must be ${maxBytes} bytes or smaller.`);
  }

  return size;
}

function assertIsoDate(value: unknown, path: string): string {
  const isoDate = assertString(value, path);

  if (Number.isNaN(Date.parse(isoDate))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return new Date(isoDate).toISOString();
}

function assertMimeType(value: unknown, path: string): HomeHeroVideoMimeType {
  if (typeof value !== "string" || !homeHeroVideoMimeTypes.includes(value as HomeHeroVideoMimeType)) {
    throw new Error(`${path} must be one of: ${homeHeroVideoMimeTypes.join(", ")}.`);
  }

  return value as HomeHeroVideoMimeType;
}

function assertMediaType(value: unknown, path: string): HomeHeroVideoMediaType {
  if (typeof value !== "string" || !homeHeroVideoMediaTypes.includes(value as HomeHeroVideoMediaType)) {
    throw new Error(`${path} must be one of: ${homeHeroVideoMediaTypes.join(", ")}.`);
  }

  return value as HomeHeroVideoMediaType;
}

function assertStorageProvider(value: unknown, path: string): HomeHeroVideoStorageProvider {
  if (typeof value !== "string" || !homeHeroVideoStorageProviders.includes(value as HomeHeroVideoStorageProvider)) {
    throw new Error(`${path} must be one of: ${homeHeroVideoStorageProviders.join(", ")}.`);
  }

  return value as HomeHeroVideoStorageProvider;
}

function assertSourceUrl(value: unknown, path: string): string {
  const url = assertString(value, path);

  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      throw new Error(`${path} must use https.`);
    }

    return parsed.toString();
  } catch {
    throw new Error(`${path} must be an absolute https URL or local / path.`);
  }
}

export function formatBytesLabel(bytes: number | null): string {
  if (bytes == null) {
    return "—";
  }

  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}

export function buildHomeHeroVideoFileNameStem(fileName: string): string {
  const normalized = fileName.trim().replace(/\.[^.]+$/, "");

  return normalized.length > 0 ? normalized : "hero-media";
}

export function clampHomeHeroVideoOrder(requestedOrder: number, totalEntries: number): number {
  if (!Number.isFinite(requestedOrder)) {
    return 1;
  }

  const normalizedOrder = Math.trunc(requestedOrder);

  if (totalEntries <= 1) {
    return 1;
  }

  return Math.min(Math.max(normalizedOrder, 1), totalEntries);
}

export function parseHomeHeroVideoRecord(value: unknown, path = "homeHeroVideoRecord"): HomeHeroVideoRecord {
  const object = assertPlainObject(value, path);
  const mediaType = assertMediaType(object.mediaType ?? "video", `${path}.mediaType`);
  const maxBytes = mediaType === "image" ? homeHeroVideoMaxImageFileSizeBytes : homeHeroVideoMaxVideoFileSizeBytes;
  const displayDurationSeconds =
    object.displayDurationSeconds == null ? null : assertPositiveInteger(object.displayDurationSeconds, `${path}.displayDurationSeconds`);

  if (mediaType === "image" && displayDurationSeconds == null) {
    throw new Error(`${path}.displayDurationSeconds must be a positive integer for image slides.`);
  }

  if (mediaType === "video" && displayDurationSeconds != null) {
    throw new Error(`${path}.displayDurationSeconds must be empty for video slides.`);
  }

  return {
    id: assertString(object.id, `${path}.id`),
    fileName: assertString(object.fileName, `${path}.fileName`),
    sourceUrl: assertSourceUrl(object.sourceUrl, `${path}.sourceUrl`),
    mediaType,
    mimeType: assertMimeType(object.mimeType, `${path}.mimeType`),
    bytes: assertNullableFileSize(object.bytes, `${path}.bytes`, maxBytes),
    displayDurationSeconds,
    order: assertPositiveInteger(object.order, `${path}.order`),
    storageProvider: assertStorageProvider(object.storageProvider, `${path}.storageProvider`),
    cloudinaryPublicId: assertNullableString(object.cloudinaryPublicId, `${path}.cloudinaryPublicId`),
    cloudinaryAssetId: assertNullableString(object.cloudinaryAssetId, `${path}.cloudinaryAssetId`),
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}

export function parseHomeHeroVideoCreateInput(
  value: unknown,
  path = "homeHeroVideoCreateInput",
): Omit<CreateHomeHeroVideoInput, "createdBy" | "updatedBy"> {
  const object = assertPlainObject(value, path);
  const mediaType = assertMediaType(object.mediaType, `${path}.mediaType`);
  const maxBytes = mediaType === "image" ? homeHeroVideoMaxImageFileSizeBytes : homeHeroVideoMaxVideoFileSizeBytes;
  const storageProvider = assertStorageProvider(object.storageProvider, `${path}.storageProvider`);
  const bytes = assertNullableFileSize(object.bytes, `${path}.bytes`, maxBytes);
  const cloudinaryPublicId = assertNullableString(object.cloudinaryPublicId, `${path}.cloudinaryPublicId`);
  const cloudinaryAssetId = assertNullableString(object.cloudinaryAssetId, `${path}.cloudinaryAssetId`);
  const displayDurationSeconds =
    object.displayDurationSeconds == null ? null : assertPositiveInteger(object.displayDurationSeconds, `${path}.displayDurationSeconds`);

  if (storageProvider === "cloudinary" && (!cloudinaryPublicId || !cloudinaryAssetId)) {
    throw new Error(`${path} cloudinary uploads must include public and asset IDs.`);
  }

  if (mediaType === "image" && displayDurationSeconds == null) {
    throw new Error(`${path} image slides must include displayDurationSeconds.`);
  }

  if (mediaType === "video" && displayDurationSeconds != null) {
    throw new Error(`${path} video slides cannot include displayDurationSeconds.`);
  }

  return {
    fileName: assertString(object.fileName, `${path}.fileName`),
    sourceUrl: assertSourceUrl(object.sourceUrl, `${path}.sourceUrl`),
    mediaType,
    mimeType: assertMimeType(object.mimeType, `${path}.mimeType`),
    bytes,
    displayDurationSeconds,
    storageProvider,
    cloudinaryPublicId,
    cloudinaryAssetId,
  };
}
