import assert from "node:assert/strict";
import test from "node:test";

import type { HomeHeroVideoRecord } from "@/types/home-hero-video";

import { deleteAdminHomeHeroVideo } from "./home-hero-video-service.ts";

const baseRecord: HomeHeroVideoRecord = {
  bytes: 12_345,
  cloudinaryAssetId: "asset-123",
  cloudinaryPublicId: "fp-pv-interculturas/home-hero-videos/hero-video-123",
  createdAt: "2026-07-01T00:00:00.000Z",
  createdBy: "admin@example.com",
  displayDurationSeconds: null,
  fileName: "hero-video.mp4",
  id: "688b7f1570f8f3a0ef418111",
  mediaType: "video",
  mimeType: "video/mp4",
  order: 1,
  sourceUrl: "https://res.cloudinary.com/demo/video/upload/v1/hero-video-123.mp4",
  storageProvider: "cloudinary",
  updatedAt: "2026-07-01T00:00:00.000Z",
  updatedBy: "admin@example.com",
};

test("deletes the database record before attempting Cloudinary cleanup", async () => {
  const operations: string[] = [];

  const deletedVideo = await deleteAdminHomeHeroVideo(
    { id: baseRecord.id },
    {
      async deleteCloudinaryAsset(publicId) {
        operations.push(`cloudinary:${publicId}`);
      },
      logger: console,
      repository: {
        async delete() {
          operations.push("repository.delete");
          return baseRecord;
        },
        async findById() {
          operations.push("repository.findById");
          return baseRecord;
        },
      },
    },
  );

  assert.deepEqual(operations, [
    "repository.findById",
    "repository.delete",
    `cloudinary:${baseRecord.cloudinaryPublicId}`,
  ]);
  assert.equal(deletedVideo?.id, baseRecord.id);
});

test("skips Cloudinary cleanup when the database delete does not remove a record", async () => {
  let attemptedCloudinaryDelete = false;

  const deletedVideo = await deleteAdminHomeHeroVideo(
    { id: baseRecord.id },
    {
      async deleteCloudinaryAsset() {
        attemptedCloudinaryDelete = true;
      },
      logger: console,
      repository: {
        async delete() {
          return null;
        },
        async findById() {
          return baseRecord;
        },
      },
    },
  );

  assert.equal(deletedVideo, null);
  assert.equal(attemptedCloudinaryDelete, false);
});

test("returns success even when Cloudinary cleanup fails after the record is deleted", async () => {
  const loggedErrors: unknown[] = [];

  const deletedVideo = await deleteAdminHomeHeroVideo(
    { id: baseRecord.id },
    {
      async deleteCloudinaryAsset() {
        throw new Error("cleanup failed");
      },
      logger: {
        error(...args) {
          loggedErrors.push(args);
        },
      },
      repository: {
        async delete() {
          return baseRecord;
        },
        async findById() {
          return baseRecord;
        },
      },
    },
  );

  assert.equal(deletedVideo?.id, baseRecord.id);
  assert.equal(loggedErrors.length, 1);
  assert.match(String((loggedErrors[0] as unknown[])[0]), /Cloudinary cleanup failed after record deletion/);
});
