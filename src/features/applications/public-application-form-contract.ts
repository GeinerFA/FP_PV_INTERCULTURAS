export const applicationFormFieldNames = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "nationality",
  "residenceCountry",
  "residenceCity",
  "birthDate",
  "identityDocument",
  "availability",
  "message",
] as const;

export type ApplicationFormFieldName = (typeof applicationFormFieldNames)[number];

export type ApplicationFormValues = Record<ApplicationFormFieldName, string>;

export type ApplicationFormValidationCode = "required" | "invalidEmail" | "invalidDate";

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
  nationality: "",
  residenceCountry: "",
  residenceCity: "",
  birthDate: "",
  identityDocument: "",
  availability: "",
  message: "",
};

export const initialApplicationSubmissionState: ApplicationSubmissionActionState = {
  status: "idle",
  values: emptyApplicationFormValues,
  fieldErrors: {},
};
