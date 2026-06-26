export const applicationStatuses = ["pending", "in_process", "resolved", "cancelled"] as const;

export const applicationTypeCodes = ["volunteering"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationTypeCode = (typeof applicationTypeCodes)[number];

export type ApplicationTypeSnapshot = {
  code: ApplicationTypeCode;
  name: string;
};

export type ApplicationChangeActor = {
  userId?: string;
  email?: string;
  role?: string;
} | null;

export type ApplicationStatusHistoryEntry = {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  reason: string | null;
  changedAt: string;
  changedBy: ApplicationChangeActor;
};

export type ApplicationTypeHistoryEntry = {
  from: ApplicationTypeSnapshot | null;
  to: ApplicationTypeSnapshot;
  reason: string | null;
  changedAt: string;
  changedBy: ApplicationChangeActor;
};

export type ApplicationSubmissionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  residenceCountry: string;
  residenceCity: string;
  birthDate: string;
  identityDocument: string;
  message: string;
  availability: string;
};

export type CreateApplicationRecordInput = Omit<
  ApplicationSubmissionInput,
  | "birthDate"
  | "identityDocument"
  | "message"
  | "availability"
  | "residenceCountry"
  | "residenceCity"
> & {
  birthDate: Date | null;
  identityDocument: string | null;
  message: string | null;
  availability: string | null;
  residenceCountry: string | null;
  residenceCity: string | null;
  fullName: string;
  applicationType: ApplicationTypeSnapshot;
  applicationTypeHistory: ApplicationTypeHistoryEntry[];
  status: ApplicationStatus;
  statusHistory: ApplicationStatusHistoryEntry[];
};

export type UpdateApplicationStatusInput = {
  id: string;
  nextStatus: ApplicationStatus;
  changedBy: ApplicationChangeActor;
  reason: string | null;
};

export type Application = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  residenceCountry: string | null;
  residenceCity: string | null;
  birthDate: string | null;
  identityDocument: string | null;
  message: string | null;
  availability: string | null;
  applicationType: ApplicationTypeSnapshot;
  applicationTypeHistory: ApplicationTypeHistoryEntry[];
  status: ApplicationStatus;
  statusHistory: ApplicationStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};
