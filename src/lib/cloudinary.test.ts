import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { v2 as cloudinary } from "cloudinary";

import { verifyCloudinaryHomeHeroVideoAsset } from "./cloudinary";

type ResourcesByAssetIds = typeof cloudinary.api.resources_by_asset_ids;
type CloudinaryAssetLookupResponse = Awaited<ReturnType<ResourcesByAssetIds>>;
type MockCloudinaryLookupOptions = {
  resource_type?: string;
  tags?: boolean;
} & Record<string, unknown>;
type MockCloudinaryLookupCallback = (err?: unknown, result?: CloudinaryAssetLookupResponse) => unknown;

const originalCloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const originalCloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const originalCloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
const originalResourcesByAssetIds = cloudinary.api.resources_by_asset_ids;

function isCloudinaryLookupCallback(value: unknown): value is MockCloudinaryLookupCallback {
  return typeof value === "function";
}

function createCloudinaryAssetLookupResponse(resources: unknown[]): CloudinaryAssetLookupResponse {
  return { resources } as CloudinaryAssetLookupResponse;
}

afterEach(() => {
  if (originalCloudinaryCloudName === undefined) {
    delete process.env.CLOUDINARY_CLOUD_NAME;
  } else {
    process.env.CLOUDINARY_CLOUD_NAME = originalCloudinaryCloudName;
  }

  if (originalCloudinaryApiKey === undefined) {
    delete process.env.CLOUDINARY_API_KEY;
  } else {
    process.env.CLOUDINARY_API_KEY = originalCloudinaryApiKey;
  }

  if (originalCloudinaryApiSecret === undefined) {
    delete process.env.CLOUDINARY_API_SECRET;
  } else {
    process.env.CLOUDINARY_API_SECRET = originalCloudinaryApiSecret;
  }

  cloudinary.api.resources_by_asset_ids = originalResourcesByAssetIds;
});

test("requests Cloudinary tags during asset verification so workflow-tagged uploads can persist", async () => {
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";

  const calls: Array<{ assetIds: string[]; options: MockCloudinaryLookupOptions | undefined }> = [];
  const now = new Date().toISOString();

  async function mockResourcesByAssetIds(
    assetIds: string[] | string,
    options?: MockCloudinaryLookupOptions,
    callback?: MockCloudinaryLookupCallback,
  ): Promise<CloudinaryAssetLookupResponse>;
  async function mockResourcesByAssetIds(
    assetIds: string[] | string,
    callback?: MockCloudinaryLookupCallback,
  ): Promise<CloudinaryAssetLookupResponse>;
  async function mockResourcesByAssetIds(
    assetIds: string[] | string,
    optionsOrCallback?: MockCloudinaryLookupOptions | MockCloudinaryLookupCallback,
    maybeCallback?: MockCloudinaryLookupCallback,
  ): Promise<CloudinaryAssetLookupResponse> {
    const options = isCloudinaryLookupCallback(optionsOrCallback) ? undefined : optionsOrCallback;
    const callback = isCloudinaryLookupCallback(optionsOrCallback) ? optionsOrCallback : maybeCallback;
    const normalizedAssetIds = Array.isArray(assetIds) ? assetIds : [assetIds];

    calls.push({ assetIds: normalizedAssetIds, options });

    const response = options?.resource_type === "image"
      ? createCloudinaryAssetLookupResponse([])
      : createCloudinaryAssetLookupResponse([
          {
            asset_id: "asset-123",
            bytes: 12_345,
            created_at: now,
            format: "mp4",
            public_id: "fp-pv-interculturas/home-hero-videos/hero-video-123",
            resource_type: "video",
            secure_url: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
            tags: ["fp-pv-interculturas", "home-hero-media"],
          },
        ]);

    callback?.(undefined, response);

    return response;
  }

  cloudinary.api.resources_by_asset_ids = mockResourcesByAssetIds;

  const verifiedAsset = await verifyCloudinaryHomeHeroVideoAsset("asset-123");

  assert.deepEqual(calls, [
    {
      assetIds: ["asset-123"],
      options: { resource_type: "image", tags: true },
    },
    {
      assetIds: ["asset-123"],
      options: { resource_type: "video", tags: true },
    },
  ]);
  assert.deepEqual(verifiedAsset, {
    assetId: "asset-123",
    bytes: 12_345,
    mediaType: "video",
    mimeType: "video/mp4",
    publicId: "fp-pv-interculturas/home-hero-videos/hero-video-123",
    sourceUrl: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
  });
});
