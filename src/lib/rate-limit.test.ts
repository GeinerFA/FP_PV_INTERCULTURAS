import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { rateLimit, resetRateLimits } from "./rate-limit";

beforeEach(() => {
  resetRateLimits();
});

test("allows up to the limit inside a window and then reports the wait", () => {
  const options = { limit: 2, windowMs: 60_000 };

  assert.equal(rateLimit("admin", options, 0).ok, true);
  assert.equal(rateLimit("admin", options, 1_000).ok, true);

  const blocked = rateLimit("admin", options, 2_000);

  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterSec, 58);
});

test("starts a new window after it expires and keeps keys independent", () => {
  const options = { limit: 1, windowMs: 1_000 };

  assert.equal(rateLimit("a", options, 0).ok, true);
  assert.equal(rateLimit("a", options, 500).ok, false);
  assert.equal(rateLimit("b", options, 500).ok, true);
  assert.equal(rateLimit("a", options, 1_000).ok, true);
});
