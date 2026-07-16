"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { notFound, redirect } from "next/navigation";

import { locales, type AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import {
  archiveAdminProgram,
  createAdminProgram,
  deleteAdminProgram,
  publishAdminProgram,
  reactivateAdminProgram,
  saveAdminProgramDraft,
} from "@/services/programs/program-service";
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

const maxCoverImageFileSizeBytes = 2 * 1024 * 1024;

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

function parseProgramSnapshotFromFormData(
  formData: FormData,
  coverImageAsset: ProgramImageAssetUpload | null,
): ProgramSnapshot {
  return parseProgramSnapshot({
    slug: readString(formData, "slug"),
    category: readString(formData, "category"),
    featured: readBoolean(formData, "featured"),
    coverImage: readString(formData, "coverImage"),
    coverImageAsset,
    location: readLocalizedText(formData, "location"),
    duration: readLocalizedText(formData, "duration"),
    availability: readLocalizedText(formData, "availability"),
    translations: Object.fromEntries(
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
    ),
    seo: Object.fromEntries(
      locales.map((locale) => [
        locale,
        {
          title: readString(formData, `seo.${locale}.title`),
          description: readString(formData, `seo.${locale}.description`),
        },
      ]),
    ),
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
  const session = await requireAdminSession({ locale, nextPath });
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

      revalidateProgramPaths(locale, createdProgram);
      redirect(buildStatusUrl(buildProgramEditPath(locale, createdProgram.id), "draft-saved"));
    }

    const updatedProgram = await saveAdminProgramDraft({
      id,
      draftSnapshot,
      updatedBy: actorEmail,
    });

    if (!updatedProgram) {
      notFound();
    }

    revalidateProgramPaths(locale, updatedProgram);
    redirect(buildStatusUrl(buildProgramEditPath(locale, updatedProgram.id), "draft-saved"));
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
  const session = await requireAdminSession({ locale, nextPath });
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
    );
  } catch {
    redirect(buildStatusUrl(nextPath, "invalid"));
  }

  const actorEmail = session.email;

  try {
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

    const publishedProgram = await publishAdminProgram({
      id: persistedProgram.id,
      updatedBy: actorEmail,
    });

    if (!publishedProgram) {
      notFound();
    }

    revalidateProgramPaths(locale, publishedProgram);
    redirect(buildStatusUrl(buildProgramEditPath(locale, publishedProgram.id), "published"));
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

  const session = await requireAdminSession({ locale, nextPath });

  const archivedProgram = await archiveAdminProgram({
    id,
    updatedBy: session.email,
  });

  if (!archivedProgram) {
    notFound();
  }

  revalidateProgramPaths(locale, archivedProgram);
  redirect(buildStatusUrl(buildProgramEditPath(locale, archivedProgram.id), "archived"));
}

export async function deleteProgramAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);

  if (!hasConfirmedDestructiveIntent(formData, "delete")) {
    redirect(buildStatusUrl(nextPath, "destructive-confirmation-required"));
  }

  const session = await requireAdminSession({ locale, nextPath });

  try {
    const deletedProgram = await deleteAdminProgram({
      id,
      updatedBy: session.email,
    });

    if (!deletedProgram) {
      notFound();
    }

    revalidateProgramPaths(locale, deletedProgram);
    redirect(buildStatusUrl(buildProgramsOverviewPath(locale), "deleted"));
  } catch (error) {
    rethrowFrameworkNavigation(error);
    redirect(buildStatusUrl(nextPath, "delete-failed"));
  }
}

export async function reactivateProgramAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildProgramEditPath(locale, id);
  const session = await requireAdminSession({ locale, nextPath });

  const reactivatedProgram = await reactivateAdminProgram({
    id,
    updatedBy: session.email,
  });

  if (!reactivatedProgram) {
    notFound();
  }

  revalidateProgramPaths(locale, reactivatedProgram);
  redirect(buildStatusUrl(buildProgramEditPath(locale, reactivatedProgram.id), "reactivated"));
}
