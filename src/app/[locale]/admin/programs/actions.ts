"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { notFound, redirect } from "next/navigation";

import { locales, sourceLocale, type AppLocale, type TranslationTargetLocale } from "@/config/i18n";
import { requireAdminAreaSession } from "@/lib/admin-session";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
import { extractProgramTranslatableContent } from "@/services/programs/program-translation-content";
import { saveProgramManualTranslation, syncProgramTranslation } from "@/services/programs/program-translation-service";
import {
  buildTranslationNoticeParams,
  runAdminTranslation,
  type AdminTranslationNotice,
} from "@/services/translation/admin-translation";
import {
  archiveAdminProgram,
  createAdminProgram,
  deleteAdminProgram,
  getAdminProgramById,
  publishAdminProgram,
  reactivateAdminProgram,
  saveAdminProgramDraft,
} from "@/services/programs/program-service";
import type { AdminProgramActivityChange } from "@/types/admin-activity";
import type {
  LocalizedText,
  Program,
  ProgramImageAssetUpload,
  ProgramSnapshot,
  ProgramTranslatableContent,
} from "@/types/program";
import { parseProgramSnapshot } from "@/validators/program";

const programTranslationLocale: TranslationTargetLocale = "en";

const supportedCoverImageContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const supportedCoverImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

const maxCoverImageFileSizeBytes = 8 * 1024 * 1024;

function buildProgramsOverviewPath(locale: AppLocale): string {
  return "/admin/programs";
}

function buildProgramCreatePath(locale: AppLocale): string {
  return "/admin/programs/new";
}

function buildProgramEditPath(locale: AppLocale, id: string): string {
  return `/admin/programs/${id}/edit`;
}

function buildProgramEnglishPath(id: string): string {
  return `/admin/programs/${id}/english`;
}

function buildStatusUrl(path: string, status: string, params?: Record<string, string>): string {
  return `${path}?${new URLSearchParams({ status, ...params }).toString()}`;
}

/** Translates the saved draft; the outcome is reported as a notice and never undoes the save. */
async function translateProgramAfterSave(
  programId: string,
  adminEmail: string,
  force = false,
): Promise<AdminTranslationNotice> {
  return runAdminTranslation(
    adminEmail,
    (beforeTranslate) => syncProgramTranslation(programId, programTranslationLocale, { force, beforeTranslate }),
    `program ${programId}`,
  );
}

function rethrowFrameworkNavigation(error: unknown): void {
  if (isRedirectError(error) || isHTTPAccessFallbackError(error)) {
    throw error;
  }
}

function resolveProgramActivityLabel(program: Pick<Program, "id" | "slug" | "translations">): string {
  const firstAvailableTitle = Object.values(program.translations)
    .map((translation) => translation.title.trim())
    .find((title) => title.length > 0);

  return (
    firstAvailableTitle ||
    program.slug.trim() ||
    program.id
  );
}

function resolveProgramSnapshotTitle(snapshot: Pick<ProgramSnapshot, "slug" | "translations">): string | null {
  const firstAvailableTitle = Object.values(snapshot.translations)
    .map((translation) => translation.title.trim())
    .find((title) => title.length > 0);

  return firstAvailableTitle || snapshot.slug.trim() || null;
}

function normalizeProgramActivityValue(value: string | boolean | null | undefined): string | null {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function buildProgramActivityChanges(
  previousSnapshot: ProgramSnapshot,
  nextSnapshot: ProgramSnapshot,
): AdminProgramActivityChange[] {
  const trackedFields: Array<{
    field: AdminProgramActivityChange["field"];
    previous: string | boolean | null;
    next: string | boolean | null;
  }> = [
    { field: "featured", previous: previousSnapshot.featured, next: nextSnapshot.featured },
    { field: "title", previous: resolveProgramSnapshotTitle(previousSnapshot), next: resolveProgramSnapshotTitle(nextSnapshot) },
    { field: "category", previous: previousSnapshot.category, next: nextSnapshot.category },
    { field: "slug", previous: previousSnapshot.slug, next: nextSnapshot.slug },
  ];

  return trackedFields.flatMap(({ field, previous, next }) => {
    const from = normalizeProgramActivityValue(previous);
    const to = normalizeProgramActivityValue(next);

    if (from === to) {
      return [];
    }

    return [{ field, from, to } satisfies AdminProgramActivityChange];
  });
}

async function recordProgramUpdatedActivity(params: {
  actor: { displayName?: string | null; email: string };
  changes: AdminProgramActivityChange[];
  program: Program;
}): Promise<void> {
  const metadata = {
    slug: params.program.publishedSnapshot?.slug ?? params.program.slug,
    ...(params.changes.length > 0 ? { programChanges: params.changes } : {}),
  };

  await recordAdminActivitySafely({
    action: "program.updated",
    entityType: "program",
    entityId: params.program.id,
    entityLabel: resolveProgramActivityLabel(params.program),
    actor: {
      displayName: params.actor.displayName ?? undefined,
      email: params.actor.email,
      role: "admin",
    },
    happenedAt: params.program.updatedAt,
    metadata,
  });
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function readLineArray(formData: FormData, key: string): string[] {
  return readString(formData, key)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function hasConfirmedDestructiveIntent(formData: FormData, intent: "archive" | "delete"): boolean {
  return readString(formData, "destructiveIntent") === intent;
}

/**
 * The main form only edits the source locale. Translated locales are kept from the current snapshot
 * (they are produced by the translation flow or edited in the English tab), never read from this form.
 */
function readLocalizedText(
  formData: FormData,
  key: "location" | "duration" | "availability",
  currentSnapshot: ProgramSnapshot | null,
): LocalizedText {
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      locale === sourceLocale ? readString(formData, `${key}.${locale}`) : (currentSnapshot?.[key][locale] ?? ""),
    ]),
  ) as LocalizedText;
}

function readCoverImageFile(formData: FormData): File | null {
  const value = formData.get("coverImageFile");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function validateCoverImageFile(file: File | null): "invalid-image-type" | "image-too-large" | null {
  if (!file) {
    return null;
  }

  const normalizedName = file.name.trim().toLowerCase();
  const hasSupportedExtension = supportedCoverImageExtensions.some((extension) => normalizedName.endsWith(extension));
  const hasSupportedContentType = file.type.length === 0 || supportedCoverImageContentTypes.has(file.type);

  if (!hasSupportedExtension || !hasSupportedContentType) {
    return "invalid-image-type";
  }

  if (file.size > maxCoverImageFileSizeBytes) {
    return "image-too-large";
  }

  return null;
}

async function buildCoverImageAsset(file: File): Promise<ProgramImageAssetUpload> {
  return {
    fileName: file.name.trim() || "program-cover-image",
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    data: Buffer.from(await file.arrayBuffer()),
  };
}

function normalizeProgramSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveProgramTitleSeed(translations: ProgramSnapshot["translations"]): string {
  return translations[sourceLocale]?.title?.trim() ?? "";
}

function buildProgramSeoFromFormData(
  formData: FormData,
  translations: ProgramSnapshot["translations"],
  currentSnapshot: ProgramSnapshot | null,
): ProgramSnapshot["seo"] {
  const defaultTitle = translations[sourceLocale]?.title?.trim() ?? "";
  const defaultDescription = translations[sourceLocale]?.shortDescription?.trim() ?? "";

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = translations[locale];
      const currentSeo = currentSnapshot?.seo[locale];

      if (locale !== sourceLocale) {
        return [locale, currentSeo ?? { title: "", description: "" }];
      }
      const explicitTitle = readString(formData, `seo.${locale}.title`);
      const explicitDescription = readString(formData, `seo.${locale}.description`);

      return [
        locale,
        {
          title:
            explicitTitle ||
            currentSeo?.title.trim() ||
            translation.title.trim() ||
            defaultTitle,
          description:
            explicitDescription ||
            currentSeo?.description.trim() ||
            translation.shortDescription.trim() ||
            defaultDescription,
        },
      ];
    }),
  ) as ProgramSnapshot["seo"];
}

function parseProgramSnapshotFromFormData(
  formData: FormData,
  coverImageAsset: ProgramImageAssetUpload | null,
  currentSnapshot: ProgramSnapshot | null,
): ProgramSnapshot {
  const translations = Object.fromEntries(
    locales.map((locale) => [
      locale,
      locale === sourceLocale
        ? {
            title: readString(formData, `translations.${locale}.title`),
            shortDescription: readString(formData, `translations.${locale}.shortDescription`),
            fullDescription: readString(formData, `translations.${locale}.fullDescription`),
            requirements: readLineArray(formData, `translations.${locale}.requirements`),
            included: readLineArray(formData, `translations.${locale}.included`),
          }
        : (currentSnapshot?.translations[locale] ?? {
            title: "",
            shortDescription: "",
            fullDescription: "",
            requirements: [],
            included: [],
          }),
    ]),
  ) as ProgramSnapshot["translations"];
  const explicitSlug = readString(formData, "slug");
  const resolvedSlug = explicitSlug || currentSnapshot?.slug.trim() || normalizeProgramSlug(resolveProgramTitleSeed(translations));

  return parseProgramSnapshot({
    slug: resolvedSlug,
    category: readString(formData, "category"),
    featured: readBoolean(formData, "featured"),
    coverImage: readString(formData, "coverImage"),
    coverImageAsset,
    location: readLocalizedText(formData, "location", currentSnapshot),
    duration: readLocalizedText(formData, "duration", currentSnapshot),
    availability: readLocalizedText(formData, "availability", currentSnapshot),
    translations,
    seo: buildProgramSeoFromFormData(formData, translations, currentSnapshot),
    translationMeta: currentSnapshot?.translationMeta ?? {},
  });
}

function revalidateProgramPaths(locale: AppLocale, program: Pick<Program, "id" | "publishedSnapshot">): void {
  revalidatePath(buildProgramsOverviewPath(locale));
  revalidatePath(buildProgramCreatePath(locale));
  revalidatePath(buildProgramEditPath(locale, program.id));
  revalidatePath(buildProgramEnglishPath(program.id));
  // Public pages exist in every locale (/programs, /en/programs, detail pages, featured programs on home).
  revalidatePath("/", "layout");
}

export async function saveProgramDraftAction(
  locale: AppLocale,
  id: string | null,
  formData: FormData,
): Promise<void> {
  const nextPath = id ? buildProgramEditPath(locale, id) : buildProgramCreatePath(locale);
  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "manage" });
  const currentProgram = id ? await getAdminProgramById(id) : null;

  if (id && !currentProgram) {
    notFound();
  }

  const coverImageFile = readCoverImageFile(formData);
  const coverImageError = validateCoverImageFile(coverImageFile);

  if (coverImageError) {
    redirect(buildStatusUrl(nextPath, coverImageError));
  }

  let draftSnapshot: ProgramSnapshot;

  try {
    draftSnapshot = parseProgramSnapshotFromFormData(
      formData,
      coverImageFile ? await buildCoverImageAsset(coverImageFile) : null,
      currentProgram?.draftSnapshot ?? null,
    );
  } catch {
    redirect(buildStatusUrl(nextPath, "invalid"));
  }

  const actorEmail = session.email;

  try {
    if (!id) {
      const createdProgram = await createAdminProgram({
        draftSnapshot,
        createdBy: actorEmail,
        updatedBy: actorEmail,
      });

      await recordAdminActivitySafely({
        action: "program.created",
        entityType: "program",
        entityId: createdProgram.id,
        entityLabel: resolveProgramActivityLabel(createdProgram),
        actor: {
          displayName: session.displayName ?? undefined,
          email: session.email,
          role: "admin",
        },
        happenedAt: createdProgram.updatedAt,
        metadata: {
          slug: createdProgram.slug,
        },
      });

      const translationNotice = await translateProgramAfterSave(createdProgram.id, actorEmail);

      revalidateProgramPaths(locale, createdProgram);
      redirect(
        buildStatusUrl(buildProgramsOverviewPath(locale), "draft-saved", buildTranslationNoticeParams(translationNotice)),
      );
    }

    const existingProgram = currentProgram;

    if (!existingProgram) {
      notFound();
    }

    const programChanges = buildProgramActivityChanges(existingProgram.draftSnapshot, draftSnapshot);
    const updatedProgram = await saveAdminProgramDraft({
      id,
      draftSnapshot,
      updatedBy: actorEmail,
    });

    if (!updatedProgram) {
      notFound();
    }

    await recordProgramUpdatedActivity({
      actor: session,
      changes: programChanges,
      program: updatedProgram,
    });

    const translationNotice = await translateProgramAfterSave(updatedProgram.id, actorEmail);

    revalidateProgramPaths(locale, updatedProgram);
    redirect(
      buildStatusUrl(buildProgramsOverviewPath(locale), "draft-saved", buildTranslationNoticeParams(translationNotice)),
    );
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, "save-failed"));
  }
}

export async function publishProgramAction(
  locale: AppLocale,
  id: string | null,
  formData: FormData,
): Promise<void> {
  const nextPath = id ? buildProgramEditPath(locale, id) : buildProgramCreatePath(locale);
  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "manage" });
  const currentProgram = id ? await getAdminProgramById(id) : null;

  if (id && !currentProgram) {
    notFound();
  }

  const coverImageFile = readCoverImageFile(formData);
  const coverImageError = validateCoverImageFile(coverImageFile);

  if (coverImageError) {
    redirect(buildStatusUrl(nextPath, coverImageError));
  }

  let draftSnapshot: ProgramSnapshot;

  try {
    draftSnapshot = parseProgramSnapshotFromFormData(
      formData,
      coverImageFile ? await buildCoverImageAsset(coverImageFile) : null,
      currentProgram?.draftSnapshot ?? null,
    );
  } catch {
    redirect(buildStatusUrl(nextPath, "invalid"));
  }

  const actorEmail = session.email;

  try {
    const isNewProgram = !id;
    const programChanges = currentProgram ? buildProgramActivityChanges(currentProgram.draftSnapshot, draftSnapshot) : [];
    const persistedProgram = id
      ? await saveAdminProgramDraft({
          id,
          draftSnapshot,
          updatedBy: actorEmail,
        })
      : await createAdminProgram({
          draftSnapshot,
          createdBy: actorEmail,
          updatedBy: actorEmail,
        });

    if (!persistedProgram) {
      notFound();
    }

    if (isNewProgram) {
      await recordAdminActivitySafely({
        action: "program.created",
        entityType: "program",
        entityId: persistedProgram.id,
        entityLabel: resolveProgramActivityLabel(persistedProgram),
        actor: {
          displayName: session.displayName ?? undefined,
          email: session.email,
          role: "admin",
        },
        happenedAt: persistedProgram.updatedAt,
        metadata: {
          slug: persistedProgram.slug,
        },
      });
    }

    if (!isNewProgram) {
      await recordProgramUpdatedActivity({
        actor: session,
        changes: programChanges,
        program: persistedProgram,
      });
    }

    // Translate the draft before publishing so the published snapshot carries the same translation.
    const translationNotice = await translateProgramAfterSave(persistedProgram.id, actorEmail);

    const publishedProgram = await publishAdminProgram({
      id: persistedProgram.id,
      updatedBy: actorEmail,
    });

    if (!publishedProgram) {
      notFound();
    }

    await recordAdminActivitySafely({
      action: "program.published",
      entityType: "program",
      entityId: publishedProgram.id,
      entityLabel: resolveProgramActivityLabel(publishedProgram),
      actor: {
        displayName: session.displayName ?? undefined,
        email: session.email,
        role: "admin",
      },
      happenedAt: publishedProgram.updatedAt,
      metadata: {
        slug: publishedProgram.publishedSnapshot?.slug ?? publishedProgram.slug,
      },
    });

    revalidateProgramPaths(locale, publishedProgram);
    redirect(
      buildStatusUrl(buildProgramsOverviewPath(locale), "published", buildTranslationNoticeParams(translationNotice)),
    );
  } catch (error) {
    rethrowFrameworkNavigation(error);
    if (id) {
      revalidatePath(buildProgramEditPath(locale, id));
    }

    redirect(buildStatusUrl(id ? buildProgramEditPath(locale, id) : buildProgramCreatePath(locale), "publish-failed"));
  }
}

function readProgramTranslatableContent(formData: FormData): ProgramTranslatableContent {
  return {
    title: readString(formData, "title"),
    shortDescription: readString(formData, "shortDescription"),
    fullDescription: readString(formData, "fullDescription"),
    requirements: readLineArray(formData, "requirements"),
    included: readLineArray(formData, "included"),
    location: readString(formData, "location"),
    duration: readString(formData, "duration"),
    availability: readString(formData, "availability"),
    seoTitle: readString(formData, "seoTitle"),
    seoDescription: readString(formData, "seoDescription"),
  };
}

/** A hand-edited translation must fill every field that has content in the source locale. */
function hasRequiredTranslatedFields(content: ProgramTranslatableContent, source: ProgramTranslatableContent): boolean {
  const scalarFields = [
    "title",
    "shortDescription",
    "fullDescription",
    "location",
    "duration",
    "availability",
    "seoTitle",
    "seoDescription",
  ] as const;

  return (
    scalarFields.every((field) => source[field].trim().length === 0 || content[field].length > 0) &&
    (source.requirements.length === 0 || content.requirements.length > 0) &&
    (source.included.length === 0 || content.included.length > 0)
  );
}

export async function saveProgramEnglishAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildProgramEnglishPath(id);
  await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "manage" });
  const currentProgram = await getAdminProgramById(id);

  if (!currentProgram) {
    notFound();
  }

  const content = readProgramTranslatableContent(formData);

  if (!hasRequiredTranslatedFields(content, extractProgramTranslatableContent(currentProgram.draftSnapshot, sourceLocale))) {
    redirect(buildStatusUrl(nextPath, "invalid"));
  }

  try {
    const savedProgram = await saveProgramManualTranslation(id, programTranslationLocale, content);

    if (!savedProgram) {
      notFound();
    }

    revalidateProgramPaths(locale, savedProgram);
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, "save-failed"));
  }

  redirect(buildStatusUrl(nextPath, "saved"));
}

/** Forces a machine translation from the source, replacing any manual corrections. */
export async function retranslateProgramAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildProgramEnglishPath(id);
  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "manage" });
  const currentProgram = await getAdminProgramById(id);

  if (!currentProgram) {
    notFound();
  }

  const translationNotice = await translateProgramAfterSave(id, session.email, true);

  if (translationNotice.outcome === "translated") {
    revalidateProgramPaths(locale, currentProgram);
  }

  redirect(buildStatusUrl(nextPath, "retranslated", buildTranslationNoticeParams(translationNotice)));
}

export async function archiveProgramAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);

  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "delete" });

  if (!hasConfirmedDestructiveIntent(formData, "archive")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required"));
  }

  const archivedProgram = await archiveAdminProgram({
    id,
    updatedBy: session.email,
  });

  if (!archivedProgram) {
    notFound();
  }

  await recordAdminActivitySafely({
    action: "program.archived",
    entityType: "program",
    entityId: archivedProgram.id,
    entityLabel: resolveProgramActivityLabel(archivedProgram),
    actor: {
      displayName: session.displayName ?? undefined,
      email: session.email,
      role: "admin",
    },
    happenedAt: archivedProgram.updatedAt,
    metadata: {
      slug: archivedProgram.publishedSnapshot?.slug ?? archivedProgram.slug,
    },
  });

  revalidateProgramPaths(locale, archivedProgram);
  redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "archived"));
}

export async function deleteProgramAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);

  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "delete" });

  if (!hasConfirmedDestructiveIntent(formData, "delete")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required"));
  }

  try {
    const deletedProgram = await deleteAdminProgram({
      id,
      updatedBy: session.email,
    });

    if (!deletedProgram) {
      notFound();
    }

    await recordAdminActivitySafely({
      action: "program.deleted",
      entityType: "program",
      entityId: deletedProgram.id,
      entityLabel: resolveProgramActivityLabel(deletedProgram),
      actor: {
        displayName: session.displayName ?? undefined,
        email: session.email,
        role: "admin",
      },
      happenedAt: deletedProgram.updatedAt,
      metadata: {
        slug: deletedProgram.publishedSnapshot?.slug ?? deletedProgram.slug,
      },
    });

    revalidateProgramPaths(locale, deletedProgram);
    redirect(buildProgramsOverviewPath(locale));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, "delete-failed"));
  }
}

export async function reactivateProgramAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);
  const session = await requireAdminAreaSession({ locale, nextPath, area: "programs", action: "manage" });

  const reactivatedProgram = await reactivateAdminProgram({
    id,
    updatedBy: session.email,
  });

  if (!reactivatedProgram) {
    notFound();
  }

  await recordAdminActivitySafely({
    action: "program.reactivated",
    entityType: "program",
    entityId: reactivatedProgram.id,
    entityLabel: resolveProgramActivityLabel(reactivatedProgram),
    actor: {
      displayName: session.displayName ?? undefined,
      email: session.email,
      role: "admin",
    },
    happenedAt: reactivatedProgram.updatedAt,
    metadata: {
      slug: reactivatedProgram.slug,
    },
  });

  revalidateProgramPaths(locale, reactivatedProgram);
  redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "reactivated"));
}
