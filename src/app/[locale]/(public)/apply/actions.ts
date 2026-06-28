"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import {
  applicationFormFieldNames,
  emptyApplicationFormValues,
  type ApplicationSubmissionActionState,
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
  const fieldErrors: Partial<Record<ApplicationFormFieldName, ApplicationFormValidationCode>> = {};

  for (const field of applicationFormFieldNames) {
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

function buildErrorState(
  values: ApplicationFormValues,
  fieldErrors: Partial<Record<ApplicationFormFieldName, ApplicationFormValidationCode>>,
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

  if (Object.keys(fieldErrors).length > 0) {
    return buildErrorState(values, fieldErrors);
  }

  try {
    await createApplication({
      ...values,
      phone: normalizePhoneNumber(values.phoneDialCode, values.phone),
      availability: null,
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
