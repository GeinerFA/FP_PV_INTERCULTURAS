"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
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

function buildStatusUrl(path: string, status: string): string {
  return `${path}?status=${encodeURIComponent(status)}`;
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
  const session = await requireAdminSession({ locale, nextPath });
  const question = readString(formData, "question");
  const answer = readString(formData, "answer");

  try {
    await createAdminFaq({
      question,
      answer,
      createdBy: session.email,
      updatedBy: session.email,
    });

    revalidateFaqPaths(locale);
    redirect(buildStatusUrl(nextPath, "created"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, question.length === 0 || answer.length === 0 ? "invalid" : "save-failed"));
  }
}

export async function updateFaqAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath });
  const question = readString(formData, "question");
  const answer = readString(formData, "answer");

  try {
    const updatedFaq = await updateAdminFaq({
      id,
      question,
      answer,
      updatedBy: session.email,
    });

    if (!updatedFaq) {
      redirect(buildStatusUrl(nextPath, "save-failed"));
    }

    revalidateFaqPaths(locale);
    redirect(buildStatusUrl(nextPath, "updated"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, question.length === 0 || answer.length === 0 ? "invalid" : "save-failed"));
  }
}

export async function deleteFaqAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  await requireAdminSession({ locale, nextPath });

  const deletedFaq = await deleteAdminFaq({ id });

  if (!deletedFaq) {
    redirect(buildStatusUrl(nextPath, "delete-failed"));
  }

  revalidateFaqPaths(locale);
  redirect(buildStatusUrl(nextPath, "deleted"));
}

export async function moveFaqAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath });

  try {
    const direction = parseFaqMoveDirection(readString(formData, "direction"));
    const movedFaqs = await moveAdminFaq({ id, direction, updatedBy: session.email });

    if (!movedFaqs) {
      redirect(buildStatusUrl(nextPath, "reorder-failed"));
    }

    revalidateFaqPaths(locale);
    redirect(buildStatusUrl(nextPath, "reordered"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, "reorder-failed"));
  }
}

export async function createProgramCategoryAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath });
  const name = readString(formData, "name");
  const theme = readString(formData, "theme");

  try {
    await createAdminProgramCategory({
      name,
      theme: theme as Parameters<typeof createAdminProgramCategory>[0]["theme"],
      createdBy: session.email,
      updatedBy: session.email,
    });

    revalidateCategoryPaths(locale);
    redirect(buildStatusUrl(nextPath, "created"));
  } catch (error) {
    rethrowFrameworkNavigation(error);

    if (error instanceof ProgramCategoryDuplicateFieldError) {
      redirect(buildStatusUrl(nextPath, "duplicate-code"));
    }

    redirect(buildStatusUrl(nextPath, name.length === 0 ? "invalid" : "save-failed"));
  }
}

export async function updateProgramCategoryAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath });
  const name = readString(formData, "name");
  const theme = readString(formData, "theme");

  try {
    const updatedCategory = await updateAdminProgramCategory({
      id,
      name,
      theme: theme as Parameters<typeof updateAdminProgramCategory>[0]["theme"],
      updatedBy: session.email,
    });

    if (!updatedCategory) {
      redirect(buildStatusUrl(nextPath, "save-failed"));
    }

    revalidateCategoryPaths(locale);
    redirect(buildStatusUrl(nextPath, "updated"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, name.length === 0 ? "invalid" : "save-failed"));
  }
}

export async function deleteProgramCategoryAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildCategorySettingsPath(locale);
  await requireAdminSession({ locale, nextPath });

  try {
    const deletedCategory = await deleteAdminProgramCategory({ id });

    if (!deletedCategory) {
      redirect(buildStatusUrl(nextPath, "delete-failed"));
    }

    revalidateCategoryPaths(locale);
    redirect(buildStatusUrl(nextPath, "deleted"));
  } catch (error) {
    rethrowFrameworkNavigation(error);

    if (error instanceof ProgramCategoryInUseError) {
      redirect(buildStatusUrl(nextPath, "delete-blocked"));
    }

    redirect(buildStatusUrl(nextPath, "delete-failed"));
  }
}
