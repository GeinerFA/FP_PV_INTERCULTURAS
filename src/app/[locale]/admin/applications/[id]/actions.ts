"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import {
  getApplicationById,
  updateApplicationStatus,
} from "@/services/applications/application-service";
import type { Application } from "@/types/application";
import { parseApplicationStatus } from "@/validators/application";

function buildDetailPath(locale: AppLocale, id: string): string {
  return `/${locale}/admin/applications/${id}`;
}

function redirectWithStatus(locale: AppLocale, id: string, key: string): never {
  redirect(`${buildDetailPath(locale, id)}?status=${key}`);
}

export async function updateApplicationStatusAction(
  locale: AppLocale,
  id: string,
  formData: FormData,
): Promise<void> {
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

  let updatedApplication: Application | null;

  try {
    updatedApplication = await updateApplicationStatus(id, nextStatus);
  } catch {
    redirectWithStatus(locale, id, "failed");
  }

  if (!updatedApplication) {
    notFound();
  }

  revalidatePath(`/${locale}/admin/applications`);
  revalidatePath(buildDetailPath(locale, id));
  redirectWithStatus(locale, id, "updated");
}
