import type { ApplicationStatus } from "@/types/application";

export const adminActivityActions = [
  "application.status_updated",
  "program.created",
  "program.updated",
  "program.published",
  "program.archived",
  "program.deleted",
  "program.reactivated",
] as const;

export const adminActivityEntityTypes = ["application", "program"] as const;

export type AdminActivityAction = (typeof adminActivityActions)[number];

export type AdminActivityEntityType = (typeof adminActivityEntityTypes)[number];

export type AdminActivityActor = {
  displayName?: string;
  email?: string;
  role?: string;
} | null;

export const adminProgramActivityChangeFields = ["featured", "title", "category", "slug"] as const;

export type AdminProgramActivityChangeField = (typeof adminProgramActivityChangeFields)[number];

export type AdminProgramActivityChange = {
  field: AdminProgramActivityChangeField;
  from?: string | null;
  to?: string | null;
};

export type AdminActivityMetadata = {
  fromStatus?: ApplicationStatus | null;
  programChanges?: AdminProgramActivityChange[];
  slug?: string | null;
  toStatus?: ApplicationStatus | null;
};

export type AdminActivityLog = {
  id: string;
  action: AdminActivityAction;
  entityType: AdminActivityEntityType;
  entityId: string;
  entityLabel: string;
  actor: AdminActivityActor;
  metadata: AdminActivityMetadata | null;
  happenedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminActivityLogInput = {
  action: AdminActivityAction;
  entityType: AdminActivityEntityType;
  entityId: string;
  entityLabel: string;
  actor?: AdminActivityActor;
  metadata?: AdminActivityMetadata | null;
  happenedAt?: string;
};
