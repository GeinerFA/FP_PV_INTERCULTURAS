"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminAreaSession } from "@/lib/admin-session";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
import { sendApplicationStatusNotification } from "@/services/notifications/application-status-notification-service";
import {
  getApplicationById,
  updateApplicationStatus,
} from "@/services/applications/application-service";
import type { Application } from "@/types/application";
import { parseApplicationStatus } from "@/validators/application";

type NotificationIntent = "none" | "send" | "skip";

function buildDetailPath(locale: AppLocale, id: string): string {
  return `/${locale}/admin/applications/${id}`;
}

function redirectWithStatus(locale: AppLocale, id: string, key: string): never {
  redirect(`${buildDetailPath(locale, id)}?status=${key}`);
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseNotificationIntent(value: FormDataEntryValue | null): NotificationIntent {
  return value === "send" || value === "skip" ? value : "none";
}

export async function updateApplicationStatusAction(
  locale: AppLocale,
  id: string,
  formData: FormData,
): Promise<void> {
  const session = await requireAdminAreaSession({
    locale,
    nextPath: buildDetailPath(locale, id),
    area: "applications",
    action: "manage",
  });

  const currentApplication = await getApplicationById(id);

  if (!currentApplication) {
    notFound();
  }

  const requestedStatus = formData.get("status");
  let nextStatus: Application["status"];

  try {
    nextStatus = parseApplicationStatus(requestedStatus);
  } catch {
    redirectWithStatus(locale, id, "invalid");
  }

  if (nextStatus === currentApplication.status) {
    redirectWithStatus(locale, id, "no-change");
  }

  const notificationIntent = parseNotificationIntent(formData.get("notificationIntent"));

  if (currentApplication.status === "pending" && nextStatus !== "pending" && notificationIntent === "none") {
    redirectWithStatus(locale, id, "notification-required");
  }

  const notificationSubject = readString(formData, "notificationSubject");
  const notificationMessage = readString(formData, "notificationMessage");

  if (notificationIntent === "send" && (!notificationSubject || !notificationMessage)) {
    redirectWithStatus(locale, id, "notification-invalid");
  }

  let updatedApplication: Application | null;

  try {
    updatedApplication = await updateApplicationStatus(
      id,
      nextStatus,
      { email: session.email, role: "admin" },
      "Status updated from admin panel.",
    );
  } catch {
    redirectWithStatus(locale, id, "failed");
  }

  if (!updatedApplication) {
    notFound();
  }

  revalidatePath(`/${locale}/admin/applications`);
  revalidatePath(buildDetailPath(locale, id));

  const latestStatusEntry = updatedApplication.statusHistory.at(-1);

  await recordAdminActivitySafely({
    action: "application.status_updated",
    entityType: "application",
    entityId: updatedApplication.id,
    entityLabel: updatedApplication.fullName || updatedApplication.email,
    actor: {
      displayName: session.displayName ?? undefined,
      email: session.email,
      role: "admin",
    },
    happenedAt: latestStatusEntry?.changedAt,
    metadata: {
      fromStatus: currentApplication.status,
      toStatus: nextStatus,
    },
  });

  if (notificationIntent === "skip") {
    redirectWithStatus(locale, id, "updated-email-skipped");
  }

  if (notificationIntent === "send") {
    let notificationResult;

    try {
      notificationResult = await sendApplicationStatusNotification({
        applicationId: updatedApplication.id,
        applicantEmail: updatedApplication.email,
        applicantName: updatedApplication.fullName,
        nextStatus,
        subject: notificationSubject,
        message: notificationMessage,
      });
    } catch {
      redirectWithStatus(locale, id, "updated-email-failed");
    }

    if (notificationResult.status === "sent") {
      redirectWithStatus(locale, id, "updated-email-sent");
    }

    if (notificationResult.status === "not_configured") {
      redirectWithStatus(locale, id, "updated-email-not-configured");
    }

    redirectWithStatus(locale, id, "updated-email-failed");
  }

  redirectWithStatus(locale, id, "updated");
}
