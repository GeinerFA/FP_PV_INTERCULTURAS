import assert from "node:assert/strict";
import test from "node:test";

import { getSiteOrigin } from "@/config/site-origin";

test("uses APP_ORIGIN without trailing slash or path", () => {
  assert.equal(getSiteOrigin({ APP_ORIGIN: "https://example.org/" }), "https://example.org");
  assert.equal(getSiteOrigin({ APP_ORIGIN: " https://example.org/some/path " }), "https://example.org");
});

test("falls back to the Vercel production domain when APP_ORIGIN is missing or invalid", () => {
  assert.equal(
    getSiteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "pvi.vercel.app" }),
    "https://pvi.vercel.app",
  );
  assert.equal(
    getSiteOrigin({ APP_ORIGIN: "not a url", VERCEL_PROJECT_PRODUCTION_URL: "pvi.vercel.app" }),
    "https://pvi.vercel.app",
  );
});

test("APP_ORIGIN wins over the Vercel domain", () => {
  assert.equal(
    getSiteOrigin({ APP_ORIGIN: "https://puravida.example", VERCEL_PROJECT_PRODUCTION_URL: "pvi.vercel.app" }),
    "https://puravida.example",
  );
});

test("defaults to localhost when nothing is configured", () => {
  assert.equal(getSiteOrigin({}), "http://localhost:3000");
});
