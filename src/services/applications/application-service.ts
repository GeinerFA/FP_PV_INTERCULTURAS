import type {
  Application,
  ApplicationChangeActor,
  ApplicationStatus,
  ApplicationStatusHistoryEntry,
  ApplicationSubmissionInput,
  ApplicationTypeHistoryEntry,
  ApplicationTypeSnapshot,
} from "@/types/application";
import { parseApplicationStatus, parseApplicationSubmission } from "@/validators/application";

import { getApplicationRepository } from "./application-repository";

export const legacyApplicationType: ApplicationTypeSnapshot = {
  code: "volunteering",
  name: "Volunteering",
};

function buildFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function buildStatusHistoryEntry(
  from: ApplicationStatus | null,
  to: ApplicationStatus,
  changedBy: ApplicationChangeActor,
  reason: string | null,
  changedAt = new Date().toISOString(),
): ApplicationStatusHistoryEntry {
  return {
    from,
    to,
    reason,
    changedAt,
    changedBy,
  };
}

function buildApplicationTypeHistory(): ApplicationTypeHistoryEntry[] {
  return [];
}

export function getActiveApplicationType(): ApplicationTypeSnapshot {
  return { ...legacyApplicationType };
}

export async function createApplication(input: unknown): Promise<Application> {
  const submission = parseApplicationSubmission(input);
  const repository = getApplicationRepository();
  const initialStatus: ApplicationStatus = "pending";
  const applicationType = getActiveApplicationType();

  return repository.create({
    ...submission,
    birthDate: new Date(submission.birthDate),
    identityDocument: submission.identityDocument,
    message: submission.message,
    availability: submission.availability,
    residenceCountry: submission.residenceCountry,
    residenceCity: submission.residenceCity,
    fullName: buildFullName(submission.firstName, submission.lastName),
    applicationType,
    applicationTypeHistory: buildApplicationTypeHistory(),
    status: initialStatus,
    statusHistory: [
      buildStatusHistoryEntry(null, initialStatus, null, "Application created from public form."),
    ],
  });
}

export async function listApplications(): Promise<Application[]> {
  const repository = getApplicationRepository();

  return repository.list();
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const repository = getApplicationRepository();

  return repository.findById(id);
}

export async function updateApplicationStatus(
  id: string,
  nextStatusInput: unknown,
  changedBy: ApplicationChangeActor = null,
  reason = "Status updated from admin panel.",
): Promise<Application | null> {
  const repository = getApplicationRepository();
  const nextStatus = parseApplicationStatus(nextStatusInput);

  return repository.updateStatus({
    id,
    nextStatus,
    changedBy,
    reason,
  });
}

export function normalizeApplicationSubmission(input: unknown): ApplicationSubmissionInput {
  return parseApplicationSubmission(input);
}
