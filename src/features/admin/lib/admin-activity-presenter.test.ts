import assert from "node:assert/strict";
import test from "node:test";

import type { AdminActivityLog } from "@/types/admin-activity";

import { getAdminActivityDetailLines, getAdminActivityFeedSummary } from "./admin-activity-presenter.ts";

const translations: Record<string, string> = {
  "feed.summary.faqCreated": "FAQ created: {target}.",
  "history.detail.faqCreated": "Created FAQ {target}.",
  "feed.summary.adminCreated": "Admin created: {target}.",
  "feed.summary.adminUserActivated": "Admin user activated: {target}.",
  "feed.summary.adminUserCreated": "Admin user created: {target}.",
  "feed.summary.superadminCreated": "Superadmin created: {target}.",
  "history.detail.adminCreated": "Created admin {target}.",
  "history.detail.adminUserActivated": "Activated admin user {target}.",
  "history.detail.adminUserCreated": "Created admin user {target}.",
  "feed.summary.homeHeroVideoReordered": "Home hero video reordered.",
  "history.detail.homeHeroVideoReordered": "Reordered home hero video {target}.",
  "history.detail.homeHeroVideoReorderedWithPositions":
    "Reordered home hero video {target} from position {fromPosition} to position {toPosition}.",
  "history.detail.superadminCreated": "Created superadmin {target}.",
};

function t(key: string, values?: Record<string, string | number | Date>) {
  const template = translations[key];

  if (!template) {
    return key;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values?.[token] ?? `{${token}}`));
}

function buildEntry(action: AdminActivityLog["action"], entityType: AdminActivityLog["entityType"], entityLabel: string): AdminActivityLog {
  return {
    id: "activity-1",
    action,
    entityType,
    entityId: "entity-1",
    entityLabel,
    actor: null,
    metadata: null,
    happenedAt: "2026-08-13T00:00:00.000Z",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  };
}

test("builds feed and history copy for FAQ activity", () => {
  const entry = buildEntry("faq.created", "faq", "How to apply?");

  assert.equal(getAdminActivityFeedSummary(entry, t), "FAQ created: How to apply?.");
  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Created FAQ How to apply?."]);
});

test("builds feed and history copy for admin user activation", () => {
  const entry = buildEntry("admin_user.activated", "admin_user", "Jane Doe · jane@example.com");

  assert.equal(getAdminActivityFeedSummary(entry, t), "Admin user activated: Jane Doe · jane@example.com.");
  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Activated admin user Jane Doe · jane@example.com."]);
});

test("builds role-aware copy for created superadmins", () => {
  const entry = {
    ...buildEntry("admin_user.created", "admin_user", "Jane Doe · jane@example.com"),
    metadata: {
      adminUserRole: "superadmin",
    },
  } satisfies AdminActivityLog;

  assert.equal(getAdminActivityFeedSummary(entry, t), "Superadmin created: Jane Doe · jane@example.com.");
  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Created superadmin Jane Doe · jane@example.com."]);
});

test("builds role-aware copy for created admins", () => {
  const entry = {
    ...buildEntry("admin_user.created", "admin_user", "Jane Doe · jane@example.com"),
    metadata: {
      adminUserRole: "admin",
    },
  } satisfies AdminActivityLog;

  assert.equal(getAdminActivityFeedSummary(entry, t), "Admin created: Jane Doe · jane@example.com.");
  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Created admin Jane Doe · jane@example.com."]);
});

test("falls back to generic copy for legacy created admin user activity", () => {
  const entry = buildEntry("admin_user.created", "admin_user", "Jane Doe · jane@example.com");

  assert.equal(getAdminActivityFeedSummary(entry, t), "Admin user created: Jane Doe · jane@example.com.");
  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Created admin user Jane Doe · jane@example.com."]);
});

test("keeps home hero video reorder feed summary generic", () => {
  const entry = buildEntry("home_hero_video.reordered", "home_hero_video", "internal-file-name.mp4");

  assert.equal(getAdminActivityFeedSummary(entry, t), "Home hero video reordered.");
});

test("shows home hero video reorder detail with positions when metadata is available", () => {
  const entry = {
    ...buildEntry("home_hero_video.reordered", "home_hero_video", "internal-file-name.mp4"),
    metadata: {
      fromPosition: 1,
      toPosition: 3,
    },
  } satisfies AdminActivityLog;

  assert.deepEqual(getAdminActivityDetailLines(entry, t), [
    "Reordered home hero video internal-file-name.mp4 from position 1 to position 3.",
  ]);
});

test("falls back to the generic home hero video reorder detail without positions", () => {
  const entry = buildEntry("home_hero_video.reordered", "home_hero_video", "internal-file-name.mp4");

  assert.deepEqual(getAdminActivityDetailLines(entry, t), ["Reordered home hero video internal-file-name.mp4."]);
});
