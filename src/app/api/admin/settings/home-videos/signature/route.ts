import { NextResponse, type NextRequest } from "next/server";

import { createHomeHeroVideoUploadSignature } from "@/lib/cloudinary";
import {
  adminSessionCookieName,
  getAuthorizedAdminSessionFromToken,
  hasAdminPermission,
} from "@/lib/admin-session";
import { homeHeroVideoMediaTypes, type HomeHeroVideoMediaType } from "@/types/home-hero-video";

export async function POST(request: NextRequest) {
  const session = await getAuthorizedAdminSessionFromToken(request.cookies.get(adminSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAdminPermission(session, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let mediaType: HomeHeroVideoMediaType = "video";

    try {
      const body = (await request.json()) as { mediaType?: unknown };

      if (typeof body?.mediaType === "string" && homeHeroVideoMediaTypes.includes(body.mediaType as HomeHeroVideoMediaType)) {
        mediaType = body.mediaType as HomeHeroVideoMediaType;
      }
    } catch {
      mediaType = "video";
    }

    return NextResponse.json(createHomeHeroVideoUploadSignature(mediaType));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the upload signature." },
      { status: 500 },
    );
  }
}
