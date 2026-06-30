"use server";

import { cookies } from "next/headers";
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
import { createApplication } from "@/services/applications/application-service";

const supportedCurriculumContentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const supportedCurriculumExtensions = [".pdf", ".doc", ".docx"];

const maxCurriculumFileSizeBytes = 5 * 1024 * 1024;

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

  const normalizedName = file.name.trim().toLowerCase();
  const hasSupportedExtension = supportedCurriculumExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );
  const hasSupportedContentType = file.type.length === 0 || supportedCurriculumContentTypes.has(file.type);

  if (!hasSupportedExtension || !hasSupportedContentType) {
    return "invalidFileType";
  }

  if (file.size > maxCurriculumFileSizeBytes) {
    return "fileTooLarge";
  }

  return null;
}

async function buildCurriculumPayload(file: File) {
  return {
    fileName: file.name.trim() || "curriculum",
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    data: Buffer.from(await file.arrayBuffer()),
  };
}

function buildErrorState(
  values: ApplicationFormValues,
  fieldErrors: Partial<Record<ApplicationFormErrorFieldName, ApplicationFormValidationCode>>,
  formError?: ApplicationSubmissionActionState["formError"],
): ApplicationSubmissionActionState {
  return {
    status: "error",
    values,
    fieldErrors,
    formError,
  };
}

export async function submitApplicationAction(
  locale: AppLocale,
  _previousState: ApplicationSubmissionActionState,
  formData: FormData,
): Promise<ApplicationSubmissionActionState> {
  const values = readApplicationFormValues(formData);
  const fieldErrors = validateApplicationForm(values);
  const curriculumFile = readCurriculumFile(formData);
  const curriculumError = validateCurriculumFile(curriculumFile);

  if (curriculumError) {
    fieldErrors.curriculum = curriculumError;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildErrorState(values, fieldErrors);
  }

  try {
    const curriculum = curriculumFile ? await buildCurriculumPayload(curriculumFile) : null;

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

    return buildErrorState(values, {}, "submissionFailed");
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
