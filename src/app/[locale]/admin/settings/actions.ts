"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import {
  createAdminActivityActor,
  resolveFaqActivityLabel,
  resolveProgramCategoryActivityLabel,
} from "@/services/admin/settings-activity";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
import {
  createAdminProgramCategory,
  deleteAdminProgramCategory,
  ProgramCategoryDuplicateFieldError,
  ProgramCategoryInUseError,
  updateAdminProgramCategory,
} from "@/services/categories/category-service";
import { createAdminFaq, deleteAdminFaq, moveAdminFaq, updateAdminFaq } from "@/services/faqs/faq-service";
import { parseFaqMoveDirection } from "@/validators/faq";

function buildFaqSettingsPath(locale: AppLocale): string {
  return `/${locale}/admin/settings/faqs`;
}

function buildCategorySettingsPath(locale: AppLocale): string {
  return `/${locale}/admin/settings/categories`;
}

function buildPublicFaqPath(locale: AppLocale): string {
  return `/${locale}/faqs`;
}

function buildProgramsOverviewPath(locale: AppLocale): string {
  return `/${locale}/admin/programs`;
}

function buildProgramsCreatePath(locale: AppLocale): string {
  return `/${locale}/admin/programs/new`;
}

function buildPublicProgramsPath(locale: AppLocale): string {
  return `/${locale}/programs`;
}

function buildPublicHomePath(locale: AppLocale): string {
  return `/${locale}`;
}

function buildStatusUrl(path: string, status: string, params?: Record<string, string | undefined>, hash?: string): string {
  const searchParams = new URLSearchParams({ status });

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const normalizedHash = hash ? `#${hash}` : "";

  return `${path}?${searchParams.toString()}${normalizedHash}`;
}

function rethrowFrameworkNavigation(error: unknown): void {
  if (isRedirectError(error) || isHTTPAccessFallbackError(error)) {
    throw error;
  }
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateFaqPaths(locale: AppLocale): void {
  revalidatePath(buildFaqSettingsPath(locale));
  revalidatePath(buildPublicFaqPath(locale));
}

function revalidateCategoryPaths(locale: AppLocale): void {
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(buildCategorySettingsPath(locale));
  revalidatePath(buildProgramsOverviewPath(locale));
  revalidatePath(buildProgramsCreatePath(locale));
  revalidatePath(buildPublicProgramsPath(locale));
  revalidatePath(buildPublicHomePath(locale));
}

export async function createFaqAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  const question = readString(formData, "question");
  const answer = readString(formData, "answer");
  let status = "created";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-faq-settings-top";

  try {
    const createdFaq = await createAdminFaq({
      question,
      answer,
      createdBy: session.email,
      updatedBy: session.email,
    });

    await recordAdminActivitySafely({
      action: "faq.created",
      entityType: "faq",
      entityId: createdFaq.id,
      entityLabel: resolveFaqActivityLabel(createdFaq),
      actor: createAdminActivityActor(session),
      happenedAt: createdFaq.updatedAt,
    });

    revalidateFaqPaths(locale);
  } catch (error) {
    rethrowFrameworkNavigation(error);

    status = question.length === 0 || answer.length === 0 ? "invalid" : "save-failed";
    params = { focus: "create" };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function updateFaqAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  const question = readString(formData, "question");
  const answer = readString(formData, "answer");
  let status = "updated";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-faq-settings-top";

  try {
    const updatedFaq = await updateAdminFaq({
      id,
      question,
      answer,
      updatedBy: session.email,
    });

    if (!updatedFaq) {
      status = "save-failed";
      params = { faq: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: "faq.updated",
        entityType: "faq",
        entityId: updatedFaq.id,
        entityLabel: resolveFaqActivityLabel(updatedFaq),
        actor: createAdminActivityActor(session),
        happenedAt: updatedFaq.updatedAt,
      });

      revalidateFaqPaths(locale);
    }
  } catch (error) {
    rethrowFrameworkNavigation(error);

    status = question.length === 0 || answer.length === 0 ? "invalid" : "save-failed";
    params = { faq: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function deleteFaqAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.delete" });
  let status = "deleted";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-faq-settings-top";

  const deletedFaq = await deleteAdminFaq({ id });

  if (!deletedFaq) {
    status = "delete-failed";
    params = { faq: id };
    hash = undefined;
  } else {
    await recordAdminActivitySafely({
      action: "faq.deleted",
      entityType: "faq",
      entityId: deletedFaq.id,
      entityLabel: resolveFaqActivityLabel(deletedFaq),
      actor: createAdminActivityActor(session),
      happenedAt: deletedFaq.updatedAt,
    });

    revalidateFaqPaths(locale);
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function moveFaqAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  let status = "reordered";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-faq-settings-top";

  try {
    const direction = parseFaqMoveDirection(readString(formData, "direction"));
    const movedFaqs = await moveAdminFaq({ id, direction, updatedBy: session.email });

    if (!movedFaqs) {
      status = "reorder-failed";
      params = { faq: id };
      hash = undefined;
    } else {
      const movedFaq = movedFaqs.find((entry) => entry.id === id);

      if (movedFaq) {
        await recordAdminActivitySafely({
          action: "faq.reordered",
          entityType: "faq",
          entityId: movedFaq.id,
          entityLabel: resolveFaqActivityLabel(movedFaq),
          actor: createAdminActivityActor(session),
          happenedAt: movedFaq.updatedAt,
        });
      }

      revalidateFaqPaths(locale);
    }
  } catch (error) {
    rethrowFrameworkNavigation(error);

    status = "reorder-failed";
    params = { faq: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function createProgramCategoryAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  const name = readString(formData, "name");
  const theme = readString(formData, "theme");
  let status = "created";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-category-settings-top";

  try {
    const createdCategory = await createAdminProgramCategory({
      name,
      theme: theme as Parameters<typeof createAdminProgramCategory>[0]["theme"],
      createdBy: session.email,
      updatedBy: session.email,
    });

    await recordAdminActivitySafely({
      action: "program_category.created",
      entityType: "program_category",
      entityId: createdCategory.id,
      entityLabel: resolveProgramCategoryActivityLabel(createdCategory),
      actor: createAdminActivityActor(session),
      happenedAt: createdCategory.updatedAt,
    });

    revalidateCategoryPaths(locale);
  } catch (error) {
    rethrowFrameworkNavigation(error);

    if (error instanceof ProgramCategoryDuplicateFieldError) {
      status = "duplicate-code";
      params = { focus: "create" };
      hash = undefined;
    } else {
      status = name.length === 0 ? "invalid" : "save-failed";
      params = { focus: "create" };
      hash = undefined;
    }
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function updateProgramCategoryAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  const name = readString(formData, "name");
  const theme = readString(formData, "theme");
  let status = "updated";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-category-settings-top";

  try {
    const updatedCategory = await updateAdminProgramCategory({
      id,
      name,
      theme: theme as Parameters<typeof updateAdminProgramCategory>[0]["theme"],
      updatedBy: session.email,
    });

    if (!updatedCategory) {
      status = "save-failed";
      params = { category: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: "program_category.updated",
        entityType: "program_category",
        entityId: updatedCategory.id,
        entityLabel: resolveProgramCategoryActivityLabel(updatedCategory),
        actor: createAdminActivityActor(session),
        happenedAt: updatedCategory.updatedAt,
      });

      revalidateCategoryPaths(locale);
    }
  } catch (error) {
    rethrowFrameworkNavigation(error);

    status = name.length === 0 ? "invalid" : "save-failed";
    params = { category: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function deleteProgramCategoryAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.delete" });
  let status = "deleted";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-category-settings-top";

  try {
    const deletedCategory = await deleteAdminProgramCategory({ id });

    if (!deletedCategory) {
      status = "delete-failed";
      params = { category: id };
      hash = undefined;
    } else {
      await recordAdminActivitySafely({
        action: "program_category.deleted",
        entityType: "program_category",
        entityId: deletedCategory.id,
        entityLabel: resolveProgramCategoryActivityLabel(deletedCategory),
        actor: createAdminActivityActor(session),
        happenedAt: deletedCategory.updatedAt,
      });

      revalidateCategoryPaths(locale);
    }
  } catch (error) {
    rethrowFrameworkNavigation(error);

    if (error instanceof ProgramCategoryInUseError) {
      status = "delete-blocked";
    } else {
      status = "delete-failed";
    }

    params = { category: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}
