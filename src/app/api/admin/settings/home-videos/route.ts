import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { locales } from "@/config/i18n";
import { deleteCloudinaryAsset, verifyCloudinaryHomeHeroVideoAsset } from "@/lib/cloudinary";
import {
  adminSessionCookieName,
  getAuthorizedAdminSessionFromToken,
  hasAdminPermission,
} from "@/lib/admin-session";
import { recordAdminActivitySafely } from "@/services/admin/activity-service";
import { createAdminActivityActor, resolveHomeHeroVideoActivityLabel } from "@/services/admin/settings-activity";
import { createAdminHomeHeroVideoFromUpload } from "@/services/home-hero-videos/home-hero-video-service";
import { parseHomeHeroVideoCreateInput } from "@/validators/home-hero-video";

export async function POST(request: NextRequest) {
  const session = await getAuthorizedAdminSessionFromToken(request.cookies.get(adminSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAdminPermission(session, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  let verifiedPublicIdToCleanup: string | null = null;

  if (!payload) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  try {
    const cloudinaryAssetId = typeof payload.cloudinaryAssetId === "string" ? payload.cloudinaryAssetId : "";
    const verifiedAsset = await verifyCloudinaryHomeHeroVideoAsset(cloudinaryAssetId);

    if (typeof payload.cloudinaryPublicId === "string" && payload.cloudinaryPublicId !== verifiedAsset.publicId) {
      throw new Error("Uploaded Cloudinary media metadata did not match the verified asset.");
    }

    const parsedInput = parseHomeHeroVideoCreateInput({
      fileName: typeof payload.fileName === "string" ? payload.fileName : verifiedAsset.publicId,
      sourceUrl: verifiedAsset.sourceUrl,
      mediaType: verifiedAsset.mediaType,
      mimeType: verifiedAsset.mimeType,
      bytes: verifiedAsset.bytes,
      displayDurationSeconds:
        typeof payload.displayDurationSeconds === "number" ? payload.displayDurationSeconds : payload.displayDurationSeconds ?? null,
      storageProvider: "cloudinary",
      cloudinaryPublicId: verifiedAsset.publicId,
      cloudinaryAssetId: verifiedAsset.assetId,
    });

    verifiedPublicIdToCleanup = verifiedAsset.publicId;

    const createdVideo = await createAdminHomeHeroVideoFromUpload({
      ...parsedInput,
      sourceUrl: verifiedAsset.sourceUrl,
      mimeType: verifiedAsset.mimeType,
      bytes: verifiedAsset.bytes,
      cloudinaryPublicId: verifiedAsset.publicId,
      cloudinaryAssetId: verifiedAsset.assetId,
      createdBy: session.email,
      updatedBy: session.email,
    });

    await recordAdminActivitySafely({
      action: "home_hero_video.created",
      entityType: "home_hero_video",
      entityId: createdVideo.id,
      entityLabel: resolveHomeHeroVideoActivityLabel(createdVideo),
      actor: createAdminActivityActor(session),
      happenedAt: createdVideo.updatedAt,
    });

    verifiedPublicIdToCleanup = null;

    for (const locale of locales) {
      revalidatePath(`/${locale}/admin/settings`);
      revalidatePath(`/${locale}/admin/settings/home-videos`);
      revalidatePath(`/${locale}`);
    }

    return NextResponse.json(createdVideo, { status: 201 });
  } catch (error) {
    if (verifiedPublicIdToCleanup) {
      await deleteCloudinaryAsset(verifiedPublicIdToCleanup, "video").catch(() => undefined);
      await deleteCloudinaryAsset(verifiedPublicIdToCleanup, "image").catch(() => undefined);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the uploaded hero media." },
      { status: 400 },
    );
  }
}
