import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  getPublicRecaptchaSiteKey,
  isExpectedRecaptchaHostname,
  resolveExpectedRecaptchaHostname,
  verifyRecaptchaToken,
} from "./recaptcha.ts";

const originalNodeEnv = process.env.NODE_ENV;
const originalSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const originalSecretKey = process.env.RECAPTCHA_SECRET_KEY;
const originalAppOrigin = process.env.APP_ORIGIN;
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

  if (originalAppOrigin === undefined) {
    delete process.env.APP_ORIGIN;
  } else {
    process.env.APP_ORIGIN = originalAppOrigin;
  }

  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

test("resolves the expected reCAPTCHA hostname from APP_ORIGIN when configured", () => {
  process.env.APP_ORIGIN = "https://Apply.Example.org:8443";

  const expectedHostname = resolveExpectedRecaptchaHostname(new Headers({ host: "ignored.example.com" }));

  assert.equal(expectedHostname, "apply.example.org");
});

test("returns null when APP_ORIGIN is invalid", () => {
  process.env.APP_ORIGIN = "://not-a-valid-origin";

  const expectedHostname = resolveExpectedRecaptchaHostname(new Headers({ host: "localhost:3000" }));

  assert.equal(expectedHostname, null);
});

test("requires APP_ORIGIN in production instead of trusting forwarded hosts", () => {
  setNodeEnv("production");
  delete process.env.APP_ORIGIN;

  const expectedHostname = resolveExpectedRecaptchaHostname(
    new Headers({ "x-forwarded-host": "apply.example.org", host: "apply.example.org" }),
  );

  assert.equal(expectedHostname, null);
});

test("returns null for invalid APP_ORIGIN in production instead of falling back to request hosts", () => {
  setNodeEnv("production");
  process.env.APP_ORIGIN = "://not-a-valid-origin";

  const expectedHostname = resolveExpectedRecaptchaHostname(
    new Headers({ "x-forwarded-host": "apply.example.org", host: "apply.example.org" }),
  );

  assert.equal(expectedHostname, null);
});

test("falls back to the forwarded request host when APP_ORIGIN is absent", () => {
  setNodeEnv("development");
  delete process.env.APP_ORIGIN;

  const expectedHostname = resolveExpectedRecaptchaHostname(
    new Headers({ "x-forwarded-host": "[::1]:3000", host: "localhost:3000" }),
  );

  assert.equal(expectedHostname, "::1");
});

test("matches reCAPTCHA hostnames case-insensitively after normalization", () => {
  assert.equal(isExpectedRecaptchaHostname("Apply.Example.org", "apply.example.org"), true);
  assert.equal(isExpectedRecaptchaHostname("evil.example.org", "apply.example.org"), false);
  assert.equal(isExpectedRecaptchaHostname(null, "apply.example.org"), false);
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
