import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminLoginPath,
  getAdminAreaPermission,
  getAdminHomePath,
  hasAdminPermission,
  isLocalizedAdminLoginPath,
  isLocalizedAdminPath,
  resolveLocaleFromAdminPath,
  sanitizeAdminNextPath,
} from "./admin-session.ts";

test("admin paths recognize canonical and legacy locale-prefixed routes", () => {
  assert.equal(isLocalizedAdminPath("/admin"), true);
  assert.equal(isLocalizedAdminPath("/admin/programs/123/edit"), true);
  assert.equal(isLocalizedAdminPath("/es/admin/applications"), true);
  assert.equal(resolveLocaleFromAdminPath("/admin/settings"), "es");
  assert.equal(resolveLocaleFromAdminPath("/es/settings"), null);
  assert.equal(isLocalizedAdminLoginPath("/admin/login"), true);
  assert.equal(isLocalizedAdminLoginPath("/es/admin/login"), true);
});

test("admin login URLs stay canonical and preserve safe legacy next paths", () => {
  assert.equal(getAdminHomePath(), "/admin");
  assert.equal(sanitizeAdminNextPath("/admin/applications"), "/admin/applications");
  assert.equal(sanitizeAdminNextPath("/es/admin/applications"), "/admin/applications");
  assert.equal(sanitizeAdminNextPath("https://evil.example/admin"), "/admin");
  assert.equal(buildAdminLoginPath("es", "/es/admin/applications"), "/admin/login?next=%2Fadmin%2Fapplications");
});

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
