import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { renderBrandedEmailTemplate } from "./branded-email.ts";

test("renderBrandedEmailTemplate returns branded html and inline branding attachment", () => {
  const result = renderBrandedEmailTemplate({
    subject: "We received your application",
    text: "Hello Applicant,\n\nYour application was received successfully.",
  });

  assert.equal((result.html ?? "").match(/cid:pvi-email-branding/g)?.length ?? 0, 1);
  assert.match(result.html ?? "", /Pura Vida Interculturas/);
  assert.match(result.html ?? "", /Your application was received successfully\./);
  assert.match(result.html ?? "", /width="200"/);
  assert.deepEqual(result.attachments, [
    {
      filename: "marca-agua-correo.png",
      path: path.join(process.cwd(), "public/branding", "marca-agua-correo.png"),
      cid: "pvi-email-branding",
      contentDisposition: "inline",
    },
  ]);
});
