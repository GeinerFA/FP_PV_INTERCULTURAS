import type { ApplicationStatus } from "@/types/application";
import type { AdminRole } from "@/types/admin-user";

export const adminActivityActions = [
  "application.status_updated",
  "faq.created",
  "faq.updated",
  "faq.deleted",
  "faq.reordered",
  "program_category.created",
  "program_category.updated",
  "program_category.deleted",
  "admin_user.created",
  "admin_user.updated",
  "admin_user.activated",
  "admin_user.deactivated",
  "admin_user.deleted",
  "home_hero_video.created",
  "home_hero_video.reordered",
  "home_hero_video.deleted",
  "program.created",
  "program.updated",
  "program.published",
  "program.archived",
  "program.deleted",
  "program.reactivated",
] as const;

export const adminActivityEntityTypes = [
  "application",
  "faq",
  "program_category",
  "admin_user",
  "home_hero_video",
  "program",
] as const;

export const adminSettingsActivityEntityTypes = ["faq", "program_category", "admin_user", "home_hero_video"] as const;

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
  adminUserRole?: AdminRole | null;
  fromStatus?: ApplicationStatus | null;
  fromPosition?: number | null;
  programChanges?: AdminProgramActivityChange[];
  slug?: string | null;
  toPosition?: number | null;
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
