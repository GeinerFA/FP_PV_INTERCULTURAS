import { randomUUID } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";

import {
  homeHeroVideoMaxImageFileSizeBytes,
  homeHeroVideoMaxVideoFileSizeBytes,
  homeHeroVideoMimeTypes,
  type HomeHeroVideoMediaType,
  type HomeHeroVideoMimeType,
} from "@/types/home-hero-video";

type CloudinaryCredentials = {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
};

type HomeHeroVideoUploadSignature = {
  acceptedMimeTypes: readonly string[];
  apiKey: string;
  cloudName: string;
  folder: string;
  maxFileSizeBytes: number;
  publicId: string;
  resourceType: HomeHeroVideoMediaType;
  signature: string;
  tags: readonly string[];
  timestamp: number;
  uploadUrl: string;
};

type VerifiedCloudinaryHomeHeroVideoAsset = {
  assetId: string;
  bytes: number;
  mediaType: HomeHeroVideoMediaType;
  mimeType: HomeHeroVideoMimeType;
  publicId: string;
  sourceUrl: string;
};

const homeHeroVideoCloudinaryFolder = "fp-pv-interculturas/home-hero-videos";
const homeHeroVideoCloudinaryPublicIdPrefix = `${homeHeroVideoCloudinaryFolder}/hero-`;
const homeHeroVideoCloudinaryTags = ["fp-pv-interculturas", "home-hero-media"] as const;
const homeHeroVideoUploadVerificationMaxAgeMs = 60 * 60 * 1000;
const homeHeroVideoUploadClockSkewMs = 5 * 60 * 1000;

function readCloudinaryCredentials(): CloudinaryCredentials {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are required for home hero media uploads.");
  }

  return { apiKey, apiSecret, cloudName };
}

function getCloudinaryClient() {
  const credentials = readCloudinaryCredentials();

  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });

  return { client: cloudinary, credentials };
}

function parseCloudinaryMimeType(mediaType: HomeHeroVideoMediaType, format: unknown): HomeHeroVideoMimeType {
  if (mediaType === "video") {
    if (format !== "mp4") {
      throw new Error(`Cloudinary home hero videos must use one of: ${homeHeroVideoMimeTypes.join(", ")}.`);
    }

    return "video/mp4";
  }

  if (format === "jpg" || format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "png") {
    return "image/png";
  }

  if (format === "webp") {
    return "image/webp";
  }

  if (format === "avif") {
    return "image/avif";
  }

  throw new Error(`Cloudinary home hero images must use one of: ${homeHeroVideoMimeTypes.join(", ")}.`);
}

function assertVerifiedHomeHeroVideoSourceUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Cloudinary home hero media must expose a secure delivery URL.");
  }

  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Cloudinary home hero media must expose an https delivery URL.");
  }

  return parsedUrl.toString();
}

function normalizeCloudinaryTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean);
}

function assertRecentHomeHeroVideoUpload(value: unknown, now = Date.now()): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Uploaded Cloudinary media verification is missing the upload timestamp.");
  }

  const uploadedAt = new Date(value);
  const uploadedAtMs = uploadedAt.getTime();

  if (Number.isNaN(uploadedAtMs)) {
    throw new Error("Uploaded Cloudinary media verification returned an invalid upload timestamp.");
  }

  if (uploadedAtMs > now + homeHeroVideoUploadClockSkewMs) {
    throw new Error("Uploaded Cloudinary media upload time is invalid.");
  }

  if (now - uploadedAtMs > homeHeroVideoUploadVerificationMaxAgeMs) {
    throw new Error("Uploaded Cloudinary media must be saved shortly after upload.");
  }
}

export function mapVerifiedCloudinaryHomeHeroVideoAsset(value: unknown): VerifiedCloudinaryHomeHeroVideoAsset {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Uploaded Cloudinary media verification returned an invalid payload.");
  }

  const asset = value as Record<string, unknown>;
  const assetId = typeof asset.asset_id === "string" ? asset.asset_id.trim() : "";
  const publicId = typeof asset.public_id === "string" ? asset.public_id.trim() : "";
  const bytes = typeof asset.bytes === "number" && Number.isInteger(asset.bytes) ? asset.bytes : NaN;
  const resourceType = typeof asset.resource_type === "string" ? asset.resource_type : "";
  const tags = normalizeCloudinaryTags(asset.tags);

  if (!assetId) {
    throw new Error("Uploaded Cloudinary media verification is missing an asset ID.");
  }

  if (!publicId) {
    throw new Error("Uploaded Cloudinary media verification is missing a public ID.");
  }

  if (!publicId.startsWith(homeHeroVideoCloudinaryPublicIdPrefix)) {
    throw new Error("Uploaded Cloudinary media must stay inside the home hero media folder.");
  }

  if (resourceType !== "image" && resourceType !== "video") {
    throw new Error("Uploaded Cloudinary asset must be an image or a video.");
  }

  if (!Number.isInteger(bytes) || bytes < 1) {
    throw new Error("Uploaded Cloudinary media must include a positive file size.");
  }

  const mediaType = resourceType;
  const maxBytes = mediaType === "image" ? homeHeroVideoMaxImageFileSizeBytes : homeHeroVideoMaxVideoFileSizeBytes;

  if (bytes > maxBytes) {
    throw new Error(`Uploaded Cloudinary ${mediaType} must be ${maxBytes} bytes or smaller.`);
  }

  for (const requiredTag of homeHeroVideoCloudinaryTags) {
    if (!tags.includes(requiredTag)) {
      throw new Error("Uploaded Cloudinary media is missing the required workflow tags.");
    }
  }

  assertRecentHomeHeroVideoUpload(asset.created_at);

  return {
    assetId,
    bytes,
    mediaType,
    mimeType: parseCloudinaryMimeType(mediaType, asset.format),
    publicId,
    sourceUrl: assertVerifiedHomeHeroVideoSourceUrl(asset.secure_url),
  };
}

function getAcceptedMimeTypes(mediaType: HomeHeroVideoMediaType): HomeHeroVideoMimeType[] {
  return homeHeroVideoMimeTypes.filter((mimeType) => mimeType.startsWith(`${mediaType}/`)) as HomeHeroVideoMimeType[];
}

export function createHomeHeroVideoUploadSignature(mediaType: HomeHeroVideoMediaType): HomeHeroVideoUploadSignature {
  const { client, credentials } = getCloudinaryClient();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `hero-${mediaType}-${randomUUID()}`;
  const paramsToSign = {
    folder: homeHeroVideoCloudinaryFolder,
    public_id: publicId,
    tags: homeHeroVideoCloudinaryTags.join(","),
    timestamp,
  };

  return {
    acceptedMimeTypes: getAcceptedMimeTypes(mediaType),
    apiKey: credentials.apiKey,
    cloudName: credentials.cloudName,
    folder: homeHeroVideoCloudinaryFolder,
    maxFileSizeBytes: mediaType === "image" ? homeHeroVideoMaxImageFileSizeBytes : homeHeroVideoMaxVideoFileSizeBytes,
    publicId,
    resourceType: mediaType,
    signature: client.utils.api_sign_request(paramsToSign, credentials.apiSecret),
    tags: homeHeroVideoCloudinaryTags,
    timestamp,
    uploadUrl: `https://api.cloudinary.com/v1_1/${credentials.cloudName}/${mediaType}/upload`,
  };
}

export async function verifyCloudinaryHomeHeroVideoAsset(assetId: string): Promise<VerifiedCloudinaryHomeHeroVideoAsset> {
  const normalizedAssetId = assetId.trim();

  if (!normalizedAssetId) {
    throw new Error("Cloudinary asset verification requires a non-empty asset ID.");
  }

  const { client } = getCloudinaryClient();
  let verifiedAsset: unknown = null;

  for (const resourceType of ["image", "video"] as const) {
    const result = await client.api.resources_by_asset_ids([normalizedAssetId], {
      resource_type: resourceType,
      tags: true,
    });
    const candidate = Array.isArray(result.resources) ? result.resources[0] : null;

    if (candidate) {
      verifiedAsset = candidate;
      break;
    }
  }

  if (!verifiedAsset) {
    throw new Error("Uploaded Cloudinary media could not be verified.");
  }

  return mapVerifiedCloudinaryHomeHeroVideoAsset(verifiedAsset);
}

export async function deleteCloudinaryAsset(publicId: string, mediaType: HomeHeroVideoMediaType): Promise<void> {
  const { client } = getCloudinaryClient();
  const result = await client.uploader.destroy(publicId, {
    resource_type: mediaType,
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary ${mediaType} deletion failed for ${publicId}.`);
  }
}
