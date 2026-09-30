"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { redirect } from "next/navigation";

import type { AppLocale, TranslationTargetLocale } from "@/config/i18n";
import { isTranslationConfigured } from "@/lib/translation";
import { requireAdminAreaSession } from "@/lib/admin-session";
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
  syncPendingProgramCategoryTranslations,
  syncProgramCategoryTranslation,
  updateAdminProgramCategory,
} from "@/services/categories/category-service";
import {
  createAdminFaq,
  deleteAdminFaq,
  moveAdminFaq,
  syncFaqTranslation,
  syncPendingFaqTranslations,
  updateAdminFaq,
} from "@/services/faqs/faq-service";
import { syncPendingProgramTranslations } from "@/services/programs/program-translation-service";
import {
  buildTranslationNoticeParams,
  consumeAdminTranslationQuota,
  runAdminTranslation,
} from "@/services/translation/admin-translation";
import { TranslationError } from "@/lib/translation/types";
import { parseFaqMoveDirection } from "@/validators/faq";

const settingsTranslationLocale: TranslationTargetLocale = "en";

function buildFaqSettingsPath(locale: AppLocale): string {
  return "/admin/settings/faqs";
}

function buildCategorySettingsPath(locale: AppLocale): string {
  return "/admin/settings/categories";
}

function buildPublicFaqPath(locale: AppLocale): string {
  return "/faqs";
}

function buildProgramsOverviewPath(locale: AppLocale): string {
  return "/admin/programs";
}

function buildProgramsCreatePath(locale: AppLocale): string {
  return "/admin/programs/new";
}

function buildPublicProgramsPath(locale: AppLocale): string {
  return "/programs";
}

function buildPublicHomePath(locale: AppLocale): string {
  return "/";
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

/** Target-locale fields of a settings form (`<field>.en`), or null when the form did not render them. */
function readSubmittedTranslation<K extends string>(formData: FormData, fields: readonly K[]): Record<K, string> | null {
  if (!fields.every((field) => formData.has(`${field}.${settingsTranslationLocale}`))) {
    return null;
  }

  return Object.fromEntries(
    fields.map((field) => [field, readString(formData, `${field}.${settingsTranslationLocale}`)]),
  ) as Record<K, string>;
}

function revalidateFaqPaths(locale: AppLocale): void {
  revalidatePath(buildFaqSettingsPath(locale));
  revalidatePath(buildPublicFaqPath(locale));
  revalidatePath("/", "layout");
}

function revalidateCategoryPaths(locale: AppLocale): void {
  revalidatePath("/admin/settings");
  revalidatePath(buildCategorySettingsPath(locale));
  revalidatePath(buildProgramsOverviewPath(locale));
  revalidatePath(buildProgramsCreatePath(locale));
  revalidatePath(buildPublicProgramsPath(locale));
  revalidatePath(buildPublicHomePath(locale));
  revalidatePath("/", "layout");
}

export async function createFaqAction(locale: AppLocale, formData: FormData): Promise<void> {
  const nextPath = buildFaqSettingsPath(locale);
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });
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

    params = buildTranslationNoticeParams(
      await runAdminTranslation(
        session.email,
        (beforeTranslate) => syncFaqTranslation(createdFaq.id, settingsTranslationLocale, { beforeTranslate }),
        `faq ${createdFaq.id}`,
      ),
    );

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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });
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

      params = buildTranslationNoticeParams(
        await runAdminTranslation(
          session.email,
          (beforeTranslate) =>
            syncFaqTranslation(updatedFaq.id, settingsTranslationLocale, {
              beforeTranslate,
              submitted: readSubmittedTranslation(formData, ["question", "answer"]),
            }),
          `faq ${updatedFaq.id}`,
        ),
      );

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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "delete" });
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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });
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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });
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

    params = buildTranslationNoticeParams(
      await runAdminTranslation(
        session.email,
        (beforeTranslate) =>
          syncProgramCategoryTranslation(createdCategory.id, settingsTranslationLocale, { beforeTranslate }),
        `category ${createdCategory.id}`,
      ),
    );

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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });
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

      params = buildTranslationNoticeParams(
        await runAdminTranslation(
          session.email,
          (beforeTranslate) =>
            syncProgramCategoryTranslation(updatedCategory.id, settingsTranslationLocale, {
              beforeTranslate,
              submitted: readSubmittedTranslation(formData, ["name"]),
            }),
          `category ${updatedCategory.id}`,
        ),
      );

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
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "delete" });
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

/** Translates every program, FAQ entry and category that is missing a translation or has a stale machine one. */
export async function translatePendingContentAction(locale: AppLocale): Promise<void> {
  const nextPath = "/admin/settings/translations";
  const session = await requireAdminAreaSession({ locale, nextPath, area: "settings", action: "manage" });

  if (!isTranslationConfigured()) {
    redirect(buildStatusUrl(nextPath, "not-configured"));
  }

  let status = "translated";
  let params: Record<string, string | undefined> | undefined;

  try {
    // The whole batch counts as one use of the admin's translation quota.
    consumeAdminTranslationQuota(session.email);

    const [programSummary, faqResults, categoryResults] = [
      await syncPendingProgramTranslations(settingsTranslationLocale),
      await syncPendingFaqTranslations(settingsTranslationLocale),
      await syncPendingProgramCategoryTranslations(settingsTranslationLocale),
    ];
    const count = (results: string[], outcome: string) => results.filter((result) => result === outcome).length;

    params = {
      translatedCount: String(
        programSummary.translated + count(faqResults, "translated") + count(categoryResults, "translated"),
      ),
      manualCount: String(programSummary.manual + count(faqResults, "manual") + count(categoryResults, "manual")),
    };

    revalidatePath("/", "layout");
  } catch (error) {
    rethrowFrameworkNavigation(error);

    if (!(error instanceof TranslationError)) {
      console.error("[settings] translatePendingContentAction failed", error);
    }

    status = "failed";
    params = {
      translationError: error instanceof TranslationError ? error.message : "error inesperado.",
    };
  }

  redirect(buildStatusUrl(nextPath, status, params));
}
