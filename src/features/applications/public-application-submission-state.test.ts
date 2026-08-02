import assert from "node:assert/strict";
import test from "node:test";

import {
  buildApplicationSubmissionErrorState,
  shouldResetCaptchaForFormError,
} from "./public-application-submission-state.ts";

const emptyApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  phoneDialCode: "+506",
  nationality: "",
  birthDate: "",
  message: "",
};

test("captcha reset is required after captcha verification fails", () => {
  assert.equal(shouldResetCaptchaForFormError("captchaFailed"), true);
});

test("captcha reset is required after application creation fails because the token is already consumed", () => {
  assert.equal(shouldResetCaptchaForFormError("submissionFailed"), true);
});

test("captcha reset is not required for validation-only failures", () => {
  assert.equal(shouldResetCaptchaForFormError(undefined), false);
});

test("error-state builder preserves field errors without forcing a captcha reset", () => {
  const state = buildApplicationSubmissionErrorState(
    emptyApplicationFormValues,
    { email: "invalidEmail" },
  );

  assert.deepEqual(state.fieldErrors, { email: "invalidEmail" });
  assert.equal(state.formError, undefined);
  assert.equal(state.resetCaptcha, false);
});

test("error-state builder marks submission failures to reset captcha before retry", () => {
  const state = buildApplicationSubmissionErrorState(
    emptyApplicationFormValues,
    {},
    "submissionFailed",
  );

  assert.equal(state.formError, "submissionFailed");
  assert.equal(state.resetCaptcha, true);
});
