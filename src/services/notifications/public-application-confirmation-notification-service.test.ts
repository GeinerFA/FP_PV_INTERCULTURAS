import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicApplicationConfirmationEmailCopy } from "./public-application-confirmation-notification-service.ts";

test("buildPublicApplicationConfirmationEmailCopy focuses the Spanish copy on confirmed receipt", () => {
  const copy = buildPublicApplicationConfirmationEmailCopy("es", "María");

  assert.equal(copy.subject, "Recibimos tu solicitud");
  assert.match(copy.text, /recibimos tu solicitud correctamente/i);
  assert.doesNotMatch(copy.text, /lista para la revisión inicial/i);
});
