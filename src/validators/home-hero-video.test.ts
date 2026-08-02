import assert from "node:assert/strict";
import test from "node:test";

import { mapVerifiedCloudinaryHomeHeroVideoAsset } from "@/lib/cloudinary";
import { homeHeroVideoMaxImageFileSizeBytes, homeHeroVideoMaxVideoFileSizeBytes } from "@/types/home-hero-video";

import {
  buildHomeHeroVideoFileNameStem,
  clampHomeHeroVideoOrder,
  parseHomeHeroVideoCreateInput,
} from "./home-hero-video.ts";

test("parses a valid Cloudinary hero video payload", () => {
  const parsed = parseHomeHeroVideoCreateInput({
    fileName: "forest.mp4",
    sourceUrl: "https://res.cloudinary.com/demo/video/upload/v1/forest.mp4",
    mediaType: "video",
    mimeType: "video/mp4",
    bytes: 12_345,
    storageProvider: "cloudinary",
    cloudinaryPublicId: "fp-pv/home-videos/forest",
    cloudinaryAssetId: "asset-123",
  });

  assert.equal(parsed.fileName, "forest.mp4");
  assert.equal(parsed.storageProvider, "cloudinary");
});

test("rejects uploads above the configured hero video limit", () => {
  assert.throws(
    () =>
      parseHomeHeroVideoCreateInput({
        fileName: "oversized.mp4",
        sourceUrl: "https://res.cloudinary.com/demo/video/upload/v1/oversized.mp4",
        mediaType: "video",
        mimeType: "video/mp4",
        bytes: homeHeroVideoMaxVideoFileSizeBytes + 1,
        storageProvider: "cloudinary",
        cloudinaryPublicId: "fp-pv/home-videos/oversized",
        cloudinaryAssetId: "asset-456",
      }),
    /must be 157286400 bytes or smaller/,
  );
});

test("requires a display duration for image slides", () => {
  assert.throws(
    () =>
      parseHomeHeroVideoCreateInput({
        fileName: "forest.webp",
        sourceUrl: "https://res.cloudinary.com/demo/image/upload/v1/forest.webp",
        mediaType: "image",
        mimeType: "image/webp",
        bytes: 12_345,
        storageProvider: "cloudinary",
        cloudinaryPublicId: "fp-pv/home-videos/forest",
        cloudinaryAssetId: "asset-789",
      }),
    /must include displayDurationSeconds/,
  );
});

test("rejects images above the configured hero image limit", () => {
  assert.throws(
    () =>
      parseHomeHeroVideoCreateInput({
        fileName: "oversized.webp",
        sourceUrl: "https://res.cloudinary.com/demo/image/upload/v1/oversized.webp",
        mediaType: "image",
        mimeType: "image/webp",
        bytes: homeHeroVideoMaxImageFileSizeBytes + 1,
        displayDurationSeconds: 6,
        storageProvider: "cloudinary",
        cloudinaryPublicId: "fp-pv/home-videos/oversized",
        cloudinaryAssetId: "asset-999",
      }),
    /must be 26214400 bytes or smaller/,
  );
});

test("clamps requested order inside the current list bounds", () => {
  assert.equal(clampHomeHeroVideoOrder(0, 4), 1);
  assert.equal(clampHomeHeroVideoOrder(3, 4), 3);
  assert.equal(clampHomeHeroVideoOrder(999, 4), 4);
});

test("builds a stable display stem from the file name", () => {
  assert.equal(buildHomeHeroVideoFileNameStem("nature.mp4"), "nature");
  assert.equal(buildHomeHeroVideoFileNameStem("  "), "hero-media");
});

test("maps verified Cloudinary home hero video metadata", () => {
  const now = new Date().toISOString();
  const verifiedAsset = mapVerifiedCloudinaryHomeHeroVideoAsset({
    asset_id: "asset-123",
    bytes: 12_345,
    created_at: now,
    format: "mp4",
    public_id: "fp-pv-interculturas/home-hero-videos/hero-video-123",
    resource_type: "video",
    secure_url: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
    tags: ["fp-pv-interculturas", "home-hero-media"],
  });

  assert.deepEqual(verifiedAsset, {
    assetId: "asset-123",
    bytes: 12_345,
    mediaType: "video",
    mimeType: "video/mp4",
    publicId: "fp-pv-interculturas/home-hero-videos/hero-video-123",
    sourceUrl: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
  });
});

test("maps verified Cloudinary home hero image metadata", () => {
  const now = new Date().toISOString();
  const verifiedAsset = mapVerifiedCloudinaryHomeHeroVideoAsset({
    asset_id: "asset-image-123",
    bytes: 22_345,
    created_at: now,
    format: "webp",
    public_id: "fp-pv-interculturas/home-hero-videos/hero-image-123",
    resource_type: "image",
    secure_url: "https://res.cloudinary.com/demo/image/upload/v1/hero-image-123.webp",
    tags: ["fp-pv-interculturas", "home-hero-media"],
  });

  assert.deepEqual(verifiedAsset, {
    assetId: "asset-image-123",
    bytes: 22_345,
    mediaType: "image",
    mimeType: "image/webp",
    publicId: "fp-pv-interculturas/home-hero-videos/hero-image-123",
    sourceUrl: "https://res.cloudinary.com/demo/image/upload/v1/hero-image-123.webp",
  });
});

test("rejects verified Cloudinary assets outside the home hero workflow", () => {
  const now = new Date().toISOString();

  assert.throws(
    () =>
      mapVerifiedCloudinaryHomeHeroVideoAsset({
        asset_id: "asset-123",
        bytes: 12_345,
        created_at: now,
        format: "mp4",
        public_id: "outside-folder/hero-video-123",
        resource_type: "video",
        secure_url: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
        tags: ["fp-pv-interculturas", "home-hero-video"],
      }),
    /must stay inside the home hero media folder/,
  );

  assert.throws(
    () =>
      mapVerifiedCloudinaryHomeHeroVideoAsset({
        asset_id: "asset-123",
        bytes: 12_345,
        created_at: now,
        format: "mp4",
        public_id: "fp-pv-interculturas/home-hero-videos/hero-video-123",
        resource_type: "video",
        secure_url: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
        tags: ["fp-pv-interculturas"],
    }),
    /missing the required workflow tags/,
  );

  assert.throws(
    () =>
      mapVerifiedCloudinaryHomeHeroVideoAsset({
        asset_id: "asset-123",
        bytes: 12_345,
        created_at: "2024-01-01T00:00:00.000Z",
        format: "mp4",
        public_id: "fp-pv-interculturas/home-hero-videos/hero-video-123",
        resource_type: "video",
        secure_url: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
        tags: ["fp-pv-interculturas", "home-hero-media"],
      }),
    /must be saved shortly after upload/,
  );
});
