import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyAdminPermissions, normalizeAdminPermissions, updateAdminPermissionSelection } from "./admin-user.ts";

test("createEmptyAdminPermissions keeps dashboard.view enabled", () => {
  const permissions = createEmptyAdminPermissions();

  assert.equal(permissions.dashboard.view, true);
  assert.equal(permissions.dashboard.manage, false);
  assert.equal(permissions.dashboard.delete, false);
});

test("normalizeAdminPermissions restores dashboard.view when omitted", () => {
  const permissions = normalizeAdminPermissions({
    dashboard: {
      view: false,
      manage: false,
      delete: false,
    },
  });

  assert.equal(permissions.dashboard.view, true);
});

test("updateAdminPermissionSelection does not allow removing dashboard.view", () => {
  const permissions = updateAdminPermissionSelection(createEmptyAdminPermissions(), "dashboard", "view", false);

  assert.equal(permissions.dashboard.view, true);
});
