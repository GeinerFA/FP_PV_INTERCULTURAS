"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { notFound, redirect } from "next/navigation";

import { defaultLocale, locales, type AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
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
import type { LocalizedText, Program, ProgramImageAssetUpload, ProgramSnapshot } from "@/types/program";
import { parseProgramSnapshot } from "@/validators/program";

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
  return `/${locale}/admin/programs`;
}

function buildProgramCreatePath(locale: AppLocale): string {
  return `/${locale}/admin/programs/new`;
}

function buildProgramEditPath(locale: AppLocale, id: string): string {
  return `/${locale}/admin/programs/${id}/edit`;
}

function buildProgramPublicListPath(locale: AppLocale): string {
  return `/${locale}/programs`;
}

function buildProgramPublicDetailPath(locale: AppLocale, slug: string): string {
  return `/${locale}/programs/${slug}`;
}

function buildStatusUrl(path: string, status: string): string {
  return `${path}?status=${encodeURIComponent(status)}`;
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

function readLocalizedText(formData: FormData, key: "location" | "duration" | "availability"): LocalizedText {
  return Object.fromEntries(locales.map((locale) => [locale, readString(formData, `${key}.${locale}`)])) as LocalizedText;
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
  const defaultTitle = translations[defaultLocale]?.title?.trim();

  if (defaultTitle) {
    return defaultTitle;
  }

  return (
    Object.values(translations)
      .map((translation) => translation.title.trim())
      .find((title) => title.length > 0) ?? ""
  );
}

function buildProgramSeoFromFormData(
  formData: FormData,
  translations: ProgramSnapshot["translations"],
  currentSnapshot: ProgramSnapshot | null,
): ProgramSnapshot["seo"] {
  const defaultTitle = translations[defaultLocale]?.title?.trim() ?? "";
  const defaultDescription = translations[defaultLocale]?.shortDescription?.trim() ?? "";

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = translations[locale];
      const currentSeo = currentSnapshot?.seo[locale];
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
      {
        title: readString(formData, `translations.${locale}.title`),
        shortDescription: readString(formData, `translations.${locale}.shortDescription`),
        fullDescription: readString(formData, `translations.${locale}.fullDescription`),
        requirements: readLineArray(formData, `translations.${locale}.requirements`),
        included: readLineArray(formData, `translations.${locale}.included`),
      },
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
    location: readLocalizedText(formData, "location"),
    duration: readLocalizedText(formData, "duration"),
    availability: readLocalizedText(formData, "availability"),
    translations,
    seo: buildProgramSeoFromFormData(formData, translations, currentSnapshot),
  });
}

function revalidateProgramPaths(locale: AppLocale, program: Pick<Program, "id" | "publishedSnapshot">): void {
  revalidatePath(buildProgramsOverviewPath(locale));
  revalidatePath(buildProgramCreatePath(locale));
  revalidatePath(buildProgramEditPath(locale, program.id));
  revalidatePath(buildProgramPublicListPath(locale));

  if (program.publishedSnapshot?.slug) {
    revalidatePath(buildProgramPublicDetailPath(locale, program.publishedSnapshot.slug));
  }
}

export async function saveProgramDraftAction(
  locale: AppLocale,
  id: string | null,
  formData: FormData,
): Promise<void> {
  const nextPath = id ? buildProgramEditPath(locale, id) : buildProgramCreatePath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "programs.manage" });
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

      revalidateProgramPaths(locale, createdProgram);
      redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "draft-saved"));
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

    revalidateProgramPaths(locale, updatedProgram);
    redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "draft-saved"));
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
  const session = await requireAdminSession({ locale, nextPath, permission: "programs.manage" });
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
    redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "published"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    if (id) {
      revalidatePath(buildProgramEditPath(locale, id));
    }

    redirect(buildStatusUrl(id ? buildProgramEditPath(locale, id) : buildProgramCreatePath(locale), "publish-failed"));
  }
}

export async function archiveProgramAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);

  if (!hasConfirmedDestructiveIntent(formData, "archive")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required"));
  }

  const session = await requireAdminSession({ locale, nextPath, permission: "programs.delete" });

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

  if (!hasConfirmedDestructiveIntent(formData, "delete")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required"));
  }

  const session = await requireAdminSession({ locale, nextPath, permission: "programs.delete" });

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
  const session = await requireAdminSession({ locale, nextPath, permission: "programs.manage" });

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
