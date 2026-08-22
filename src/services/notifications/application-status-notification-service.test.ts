import assert from "node:assert/strict";
import test from "node:test";

import { shouldSendApplicationStatusNotification } from "./application-status-notification-service.ts";

test("shouldSendApplicationStatusNotification only allows pending to in_process", () => {
  assert.equal(shouldSendApplicationStatusNotification("pending", "in_process"), true);
  assert.equal(shouldSendApplicationStatusNotification("pending", "resolved"), false);
  assert.equal(shouldSendApplicationStatusNotification("pending", "cancelled"), false);
  assert.equal(shouldSendApplicationStatusNotification("in_process", "resolved"), false);
});
