import type { AdminActivityEntityType, AdminActivityLog, CreateAdminActivityLogInput } from "@/types/admin-activity";
import { parseCreateAdminActivityLogInput } from "@/validators/admin-activity";

import { getAdminActivityRepository } from "./activity-repository";

export type ListAdminActivityLogsOptions = {
  includeEntityCounts?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listAdminActivityLogs(options?: ListAdminActivityLogsOptions) {
  return getAdminActivityRepository().list({
    includeEntityCounts: options?.includeEntityCounts,
    page: options?.page,
    pageSize: options?.pageSize,
  });
}

export async function listAdminActivityLogsForEntity(
  entityType: AdminActivityEntityType,
  entityId: string,
): Promise<AdminActivityLog[]> {
  return getAdminActivityRepository().list({ entityId, entityType, pageSize: 50 }).then((result) => result.entries);
}

export async function recordAdminActivity(input: CreateAdminActivityLogInput): Promise<AdminActivityLog> {
  return getAdminActivityRepository().create(parseCreateAdminActivityLogInput(input));
}

export async function recordAdminActivitySafely(input: CreateAdminActivityLogInput): Promise<void> {
  try {
    await recordAdminActivity(input);
  } catch (error) {
    console.error("[admin-activity] failed to persist activity log", error);
  }
}
