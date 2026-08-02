import type {
  ApplicationFormErrorFieldName,
  ApplicationFormValidationCode,
  ApplicationFormValues,
  ApplicationSubmissionActionState,
  ApplicationSubmissionErrorCode,
} from "./public-application-form-contract";

export function shouldResetCaptchaForFormError(
  formError?: ApplicationSubmissionErrorCode,
): boolean {
  return formError === "captchaFailed" || formError === "submissionFailed";
}

export function buildApplicationSubmissionErrorState(
  values: ApplicationFormValues,
  fieldErrors: Partial<Record<ApplicationFormErrorFieldName, ApplicationFormValidationCode>>,
  formError?: ApplicationSubmissionErrorCode,
): ApplicationSubmissionActionState {
  return {
    status: "error",
    values,
    fieldErrors,
    formError,
    resetCaptcha: shouldResetCaptchaForFormError(formError),
  };
}
