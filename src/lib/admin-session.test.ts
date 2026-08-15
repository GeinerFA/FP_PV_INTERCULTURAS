import assert from "node:assert/strict";
import test from "node:test";

import { getAdminAreaPermission, hasAdminPermission } from "./admin-session.ts";

test("getAdminAreaPermission resolves target module permissions for hardened admin mutations", () => {
  assert.equal(getAdminAreaPermission("programs", "manage"), "programs.manage");
  assert.equal(getAdminAreaPermission("programs", "delete"), "programs.delete");
  assert.equal(getAdminAreaPermission("applications", "manage"), "applications.manage");
  assert.equal(getAdminAreaPermission("applications", "view"), "applications.view");
  assert.equal(getAdminAreaPermission("settings", "manage"), "settings.manage");
  assert.equal(getAdminAreaPermission("settings", "delete"), "settings.delete");
  assert.equal(getAdminAreaPermission("users", "manage"), "users.manage");
  assert.equal(getAdminAreaPermission("users", "delete"), "users.delete");
});

test("hasAdminPermission keeps view-only application downloads available without granting mutations", () => {
  const session = {
    role: "admin" as const,
    permissions: {
      activity: { view: false, manage: false, delete: false },
      applications: { view: true, manage: false, delete: false },
      dashboard: { view: true, manage: false, delete: false },
      programs: { view: false, manage: false, delete: false },
      settings: { view: false, manage: false, delete: false },
      users: { view: false, manage: false, delete: false },
    },
  };

  assert.equal(hasAdminPermission(session, getAdminAreaPermission("applications", "view")), true);
  assert.equal(hasAdminPermission(session, getAdminAreaPermission("applications", "manage")), false);
  assert.equal(hasAdminPermission(session, getAdminAreaPermission("applications", "delete")), false);
});

test("hasAdminPermission preserves superadmin override for centralized area permissions", () => {
  const session = {
    role: "superadmin" as const,
    permissions: {
      activity: { view: false, manage: false, delete: false },
      applications: { view: false, manage: false, delete: false },
      dashboard: { view: true, manage: false, delete: false },
      programs: { view: false, manage: false, delete: false },
      settings: { view: false, manage: false, delete: false },
      users: { view: false, manage: false, delete: false },
    },
  };

  assert.equal(hasAdminPermission(session, getAdminAreaPermission("users", "delete")), true);
});
