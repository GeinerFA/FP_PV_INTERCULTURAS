"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import { deleteAdminHomeHeroVideo, updateAdminHomeHeroVideoOrder } from "@/services/home-hero-videos/home-hero-video-service";

function buildHomeVideoSettingsPath(locale: AppLocale): string {
  return `/${locale}/admin/settings/home-videos`;
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

function readOrder(formData: FormData): number {
  const rawValue = formData.get("order");
  const parsedValue = typeof rawValue === "string" ? Number(rawValue) : Number.NaN;

  return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : Number.NaN;
}

function readDisplayDurationSeconds(formData: FormData): number | null {
  const rawValue = formData.get("displayDurationSeconds");

  if (rawValue == null || rawValue === "") {
    return null;
  }

  const parsedValue = typeof rawValue === "string" ? Number(rawValue) : Number.NaN;

  return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : Number.NaN;
}

function revalidateHomeVideoPaths(locale: AppLocale): void {
  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(buildHomeVideoSettingsPath(locale));
  revalidatePath(buildPublicHomePath(locale));
}

export async function updateHomeHeroVideoOrderAction(locale: AppLocale, id: string, formData: FormData): Promise<void> {
  const nextPath = buildHomeVideoSettingsPath(locale);
  const session = await requireAdminSession({ locale, nextPath, permission: "settings.manage" });
  const order = readOrder(formData);
  const displayDurationSeconds = readDisplayDurationSeconds(formData);
  const mediaType = formData.get("mediaType");
  let status = "reordered";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-home-hero-video-settings-top";

  try {
    if (!Number.isInteger(order) || order < 1) {
      status = "invalid";
      params = { video: id };
      hash = undefined;
    } else if (mediaType === "image" && (!Number.isInteger(displayDurationSeconds) || (displayDurationSeconds as number) < 1)) {
      status = "invalid";
      params = { video: id };
      hash = undefined;
    } else {
      const reorderedVideos = await updateAdminHomeHeroVideoOrder({
        id,
        order,
        displayDurationSeconds: mediaType === "image" ? displayDurationSeconds : null,
        updatedBy: session.email,
      });

      if (!reorderedVideos) {
        status = "reorder-failed";
        params = { video: id };
        hash = undefined;
      } else {
        revalidateHomeVideoPaths(locale);
      }
    }
  } catch {
    status = "reorder-failed";
    params = { video: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}

export async function deleteHomeHeroVideoAction(locale: AppLocale, id: string): Promise<void> {
  const nextPath = buildHomeVideoSettingsPath(locale);
  await requireAdminSession({ locale, nextPath, permission: "settings.delete" });
  let status = "deleted";
  let params: Record<string, string | undefined> | undefined;
  let hash: string | undefined = "admin-home-hero-video-settings-top";

  try {
    const deletedVideo = await deleteAdminHomeHeroVideo({ id });

    if (!deletedVideo) {
      status = "delete-failed";
      params = { video: id };
      hash = undefined;
    } else {
      revalidateHomeVideoPaths(locale);
    }
  } catch {
    status = "delete-failed";
    params = { video: id };
    hash = undefined;
  }

  redirect(buildStatusUrl(nextPath, status, params, hash));
}
