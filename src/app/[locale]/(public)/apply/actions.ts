"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import {
  applicationFormFieldNames,
  emptyApplicationFormValues,
  requiredApplicationFormFieldNames,
  type ApplicationSubmissionActionState,
  type ApplicationFormErrorFieldName,
  type ApplicationFormFieldName,
  type ApplicationFormValidationCode,
  type ApplicationFormValues,
} from "@/features/applications/public-application-form-contract";
import { isSupportedCountryName } from "@/features/applications/country-options";
import {
  defaultPublicPhoneDialCode,
  isSupportedPhoneDialCode,
  normalizePhoneNumber,
} from "@/features/applications/phone-country-options";
import {
  publicApplicationSuccessCookieMaxAgeSeconds,
  publicApplicationSuccessCookieName,
  publicApplicationSuccessCookieValue,
} from "@/features/applications/public-application-flow";
import { buildApplicationSubmissionErrorState } from "@/features/applications/public-application-submission-state";
import {
  isExpectedRecaptchaHostname,
  resolveExpectedRecaptchaHostname,
  verifyRecaptchaToken,
} from "@/lib/recaptcha";
import { createApplication } from "@/services/applications/application-service";
import { sendPublicApplicationConfirmation } from "@/services/notifications/public-application-confirmation-notification-service";
import {
  applicationCurriculumPdfContentType,
  hasApplicationCurriculumPdfSignature,
  isApplicationCurriculumPdfMetadata,
} from "@/validators/application";

const maxCurriculumFileSizeBytes = 5 * 1024 * 1024;

const recaptchaTokenFieldName = "recaptchaToken";

function readFieldValue(formData: FormData, field: ApplicationFormFieldName): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function readApplicationFormValues(formData: FormData): ApplicationFormValues {
  const phoneDialCodeValue = formData.get("phoneDialCode");
  const phoneDialCode =
    typeof phoneDialCodeValue === "string" && isSupportedPhoneDialCode(phoneDialCodeValue)
      ? phoneDialCodeValue
      : defaultPublicPhoneDialCode;

  return applicationFormFieldNames.reduce<ApplicationFormValues>(
    (values, field) => {
      values[field] = readFieldValue(formData, field);
      return values;
    },
    {
      ...emptyApplicationFormValues,
      phoneDialCode,
    },
  );
}

function readRecaptchaToken(formData: FormData): string {
  const value = formData.get(recaptchaTokenFieldName);

  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

function validateApplicationForm(values: ApplicationFormValues) {
  const fieldErrors: Partial<Record<ApplicationFormErrorFieldName, ApplicationFormValidationCode>> = {};

  for (const field of requiredApplicationFormFieldNames) {
    if (values[field].length === 0) {
      fieldErrors[field] = "required";
    }
  }

  if (!fieldErrors.email && !isValidEmail(values.email)) {
    fieldErrors.email = "invalidEmail";
  }

  if (!fieldErrors.birthDate && !isValidDate(values.birthDate)) {
    fieldErrors.birthDate = "invalidDate";
  }

  if (!fieldErrors.nationality && !isSupportedCountryName(values.nationality)) {
    fieldErrors.nationality = "invalidSelection";
  }

  return fieldErrors;
}

function readCurriculumFile(formData: FormData): File | null {
  const value = formData.get("curriculum");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function validateCurriculumFile(file: File | null): ApplicationFormValidationCode | null {
  if (!file) {
    return null;
  }

  if (!isApplicationCurriculumPdfMetadata(file.name, file.type)) {
    return "invalidFileType";
  }

  if (file.size > maxCurriculumFileSizeBytes) {
    return "fileTooLarge";
  }

  return null;
}

async function buildCurriculumPayload(file: File): Promise<
  | {
      fileName: string;
      contentType: string;
      sizeBytes: number;
      uploadedAt: string;
      data: Buffer;
    }
  | null
> {
  const data = Buffer.from(await file.arrayBuffer());

  if (!hasApplicationCurriculumPdfSignature(data)) {
    return null;
  }

  return {
    fileName: file.name.trim() || "curriculum",
    contentType: applicationCurriculumPdfContentType,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    data,
  };
}

function getRequestIp(headerStore: Headers): string | null {
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");

    if (firstIp && firstIp.trim().length > 0) {
      return firstIp.trim();
    }
  }

  const realIp = headerStore.get("x-real-ip");

  return realIp && realIp.trim().length > 0 ? realIp.trim() : null;
}

function buildApplicantFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export async function submitApplicationAction(
  locale: AppLocale,
  _previousState: ApplicationSubmissionActionState,
  formData: FormData,
): Promise<ApplicationSubmissionActionState> {
  const values = readApplicationFormValues(formData);
  const recaptchaToken = readRecaptchaToken(formData);
  const fieldErrors = validateApplicationForm(values);
  const curriculumFile = readCurriculumFile(formData);
  const curriculumError = validateCurriculumFile(curriculumFile);

  if (curriculumError) {
    fieldErrors.curriculum = curriculumError;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildApplicationSubmissionErrorState(values, fieldErrors);
  }

  const requestHeaders = await headers();
  const expectedRecaptchaHostname = resolveExpectedRecaptchaHostname(requestHeaders);
  const recaptchaVerification = await verifyRecaptchaToken({
    token: recaptchaToken,
    remoteIp: getRequestIp(requestHeaders),
  });

  if (!recaptchaVerification.success) {
    console.warn("[apply] reCAPTCHA verification failed", {
      email: values.email,
      errorCodes: recaptchaVerification.errorCodes,
      hostname: recaptchaVerification.hostname,
    });

    return buildApplicationSubmissionErrorState(values, {}, "captchaFailed");
  }

  if (!isExpectedRecaptchaHostname(recaptchaVerification.hostname, expectedRecaptchaHostname)) {
    console.warn("[apply] reCAPTCHA hostname mismatch", {
      email: values.email,
      expectedHostname: expectedRecaptchaHostname,
      receivedHostname: recaptchaVerification.hostname,
    });

    return buildApplicationSubmissionErrorState(values, {}, "captchaFailed");
  }

  const curriculum = curriculumFile ? await buildCurriculumPayload(curriculumFile) : null;

  if (curriculumFile && !curriculum) {
    return buildApplicationSubmissionErrorState(values, { curriculum: "invalidFileType" });
  }

  try {
    await createApplication({
      ...values,
      phone: normalizePhoneNumber(values.phoneDialCode, values.phone),
      message: values.message.length > 0 ? values.message : null,
      availability: null,
      curriculum,
    });
  } catch (error) {
    console.error("[apply] Failed to create application", {
      error,
      email: values.email,
      applicationType: "volunteering",
    });

    return buildApplicationSubmissionErrorState(values, {}, "submissionFailed");
  }

  try {
    const confirmationResult = await sendPublicApplicationConfirmation({
      locale,
      applicantEmail: values.email,
      applicantName: buildApplicantFullName(values.firstName, values.lastName),
    });

    if (confirmationResult.status !== "sent") {
      console.warn("[apply] Application confirmation email was not sent", {
        email: values.email,
        provider: confirmationResult.provider,
        code: confirmationResult.code,
        status: confirmationResult.status,
      });
    }
  } catch (error) {
    console.error("[apply] Failed to send application confirmation email", {
      email: values.email,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: publicApplicationSuccessCookieName,
    value: publicApplicationSuccessCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: publicApplicationSuccessCookieMaxAgeSeconds,
    path: `/${locale}/apply`,
  });

  redirect(`/${locale}/apply/success`);
}
