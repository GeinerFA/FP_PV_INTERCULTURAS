import { defaultPublicPhoneDialCode } from "@/features/applications/phone-country-options";

export const applicationFormFieldNames = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "nationality",
  "birthDate",
  "message",
] as const;

export type ApplicationFormFieldName = (typeof applicationFormFieldNames)[number];

export type ApplicationFormValues = Record<ApplicationFormFieldName, string> & {
  phoneDialCode: string;
};

export type ApplicationFormValidationCode =
  | "required"
  | "invalidEmail"
  | "invalidDate"
  | "invalidSelection";

export type ApplicationSubmissionErrorCode = "submissionFailed";

export type ApplicationSubmissionActionState = {
  status: "idle" | "error";
  values: ApplicationFormValues;
  fieldErrors: Partial<Record<ApplicationFormFieldName, ApplicationFormValidationCode>>;
  formError?: ApplicationSubmissionErrorCode;
};

export const emptyApplicationFormValues: ApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  phoneDialCode: defaultPublicPhoneDialCode,
  nationality: "",
  birthDate: "",
  message: "",
};

export const initialApplicationSubmissionState: ApplicationSubmissionActionState = {
  status: "idle",
  values: emptyApplicationFormValues,
  fieldErrors: {},
};
