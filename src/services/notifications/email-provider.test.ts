import assert from "node:assert/strict";
import test from "node:test";

import { createEmailProvider, resolveEmailProviderConfiguration } from "./email-provider.ts";

test("resolveEmailProviderConfiguration keeps noop behavior when provider is absent", () => {
  assert.deepEqual(resolveEmailProviderConfiguration({}), {
    type: "noop",
  });
});

test("createEmailProvider reports Gmail as not configured when credentials are missing", async () => {
  const provider = createEmailProvider({
    env: {
      EMAIL_PROVIDER: "gmail",
      EMAIL_GMAIL_USER: "sender@example.com",
    },
    createTransport() {
      throw new Error("createTransport should not be called for misconfigured providers");
    },
  });

  const result = await provider.send({
    to: "applicant@example.com",
    subject: "Subject",
    text: "Body",
  });

  assert.equal(result.status, "not_configured");
  assert.equal(result.provider, "gmail");
  assert.equal(result.code, "provider_not_configured");
  assert.match(result.reason, /EMAIL_GMAIL_APP_PASSWORD/);
});

test("createEmailProvider sends messages through the Gmail transport", async () => {
  const sentMessages: Array<Record<string, unknown>> = [];

  const provider = createEmailProvider({
    env: {
      EMAIL_PROVIDER: "gmail",
      EMAIL_GMAIL_USER: "sender@example.com",
      EMAIL_GMAIL_APP_PASSWORD: "app-password",
      EMAIL_FROM: "sender@example.com",
    },
    createTransport(options) {
      assert.deepEqual(options, {
        service: "gmail",
        auth: {
          user: "sender@example.com",
          pass: "app-password",
        },
      });

      return {
        async sendMail(message) {
          sentMessages.push(message as Record<string, unknown>);

          return {
            messageId: "message-123",
          };
        },
      };
    },
  });

  const result = await provider.send({
    to: "applicant@example.com",
    subject: "Application received",
    text: "Thanks for applying",
    html: "<p>Thanks for applying</p>",
    attachments: [
      {
        filename: "marca-agua-correo.png",
        path: "/tmp/marca-agua-correo.png",
        cid: "brand",
        contentDisposition: "inline",
      },
    ],
  });

  assert.deepEqual(sentMessages, [
    {
      from: "sender@example.com",
      to: "applicant@example.com",
      subject: "Application received",
      text: "Thanks for applying",
      html: "<p>Thanks for applying</p>",
      attachments: [
        {
          filename: "marca-agua-correo.png",
          path: "/tmp/marca-agua-correo.png",
          cid: "brand",
          contentDisposition: "inline",
        },
      ],
    },
  ]);
  assert.deepEqual(result, {
    status: "sent",
    provider: "gmail",
    code: "sent",
    messageId: "message-123",
  });
});
