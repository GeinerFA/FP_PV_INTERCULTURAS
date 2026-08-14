import assert from "node:assert/strict";
import test from "node:test";

import { parseAdminActivityLog } from "./admin-activity.ts";

test("accepts null admin user role metadata from stored activity records", () => {
  const entry = parseAdminActivityLog({
    id: "activity-1",
    action: "home_hero_video.reordered",
    entityType: "home_hero_video",
    entityId: "video-1",
    entityLabel: "hero.mp4",
    actor: null,
    metadata: {
      adminUserRole: null,
      fromPosition: 1,
      toPosition: 2,
    },
    happenedAt: "2026-08-13T00:00:00.000Z",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.deepEqual(entry.metadata, {
    adminUserRole: null,
    fromPosition: 1,
    slug: undefined,
    toPosition: 2,
  });
});
