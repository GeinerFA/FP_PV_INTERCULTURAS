import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { getPublicRecaptchaSiteKey, verifyRecaptchaToken } from "./recaptcha.ts";

const originalNodeEnv = process.env.NODE_ENV;
const originalSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const originalSecretKey = process.env.RECAPTCHA_SECRET_KEY;
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);

  if (originalSiteKey === undefined) {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  } else {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalSiteKey;
  }

  if (originalSecretKey === undefined) {
    delete process.env.RECAPTCHA_SECRET_KEY;
  } else {
    process.env.RECAPTCHA_SECRET_KEY = originalSecretKey;
  }

  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

test("returns the configured public site key when present", () => {
  setNodeEnv("development");
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "real-site-key";

  assert.equal(getPublicRecaptchaSiteKey(), "real-site-key");
});

test("falls back to the Google reCAPTCHA v2 test site key outside production", () => {
  setNodeEnv("development");
  delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  assert.equal(getPublicRecaptchaSiteKey(), "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI");
});

test("keeps production strict when the public site key is missing", () => {
  setNodeEnv("production");
  delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  assert.throws(
    () => getPublicRecaptchaSiteKey(),
    /NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable is required in production/,
  );
});

test("falls back to the Google reCAPTCHA v2 test secret outside production", async () => {
  setNodeEnv("development");
  delete process.env.RECAPTCHA_SECRET_KEY;

  let receivedBody = "";

  globalThis.fetch = (async (_input, init) => {
    const body = init?.body;
    receivedBody = body instanceof URLSearchParams ? body.toString() : String(body ?? "");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const result = await verifyRecaptchaToken({ token: "captcha-token" });

  assert.equal(result.success, true);
  assert.match(receivedBody, /secret=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe/);
  assert.match(receivedBody, /response=captcha-token/);
});

test("does not silently use test secrets in production", async () => {
  setNodeEnv("production");
  delete process.env.RECAPTCHA_SECRET_KEY;
  console.error = () => {};

  let calledFetch = false;

  globalThis.fetch = (async () => {
    calledFetch = true;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const result = await verifyRecaptchaToken({ token: "captcha-token" });

  assert.equal(calledFetch, false);
  assert.equal(result.success, false);
  assert.deepEqual(result.errorCodes, ["verification-request-failed"]);
});
