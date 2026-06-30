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

export const requiredApplicationFormFieldNames = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "nationality",
  "birthDate",
] as const satisfies readonly (typeof applicationFormFieldNames)[number][];

export const applicationAttachmentFieldNames = ["curriculum"] as const;

export type ApplicationFormFieldName = (typeof applicationFormFieldNames)[number];

export type ApplicationAttachmentFieldName = (typeof applicationAttachmentFieldNames)[number];

export type ApplicationFormErrorFieldName = ApplicationFormFieldName | ApplicationAttachmentFieldName;

export type ApplicationFormValues = Record<ApplicationFormFieldName, string> & {
  phoneDialCode: string;
};

export type ApplicationFormValidationCode =
  | "required"
  | "invalidEmail"
  | "invalidDate"
  | "invalidSelection"
  | "invalidFileType"
  | "fileTooLarge";

export type ApplicationSubmissionErrorCode = "submissionFailed";

export type ApplicationSubmissionActionState = {
  status: "idle" | "error";
  values: ApplicationFormValues;
  fieldErrors: Partial<Record<ApplicationFormErrorFieldName, ApplicationFormValidationCode>>;
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
