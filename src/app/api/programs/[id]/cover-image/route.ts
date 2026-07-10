import { NextRequest, NextResponse } from "next/server";

import {
  adminSessionCookieName,
  buildAdminLoginPath,
  readAdminSessionToken,
  resolveLocaleFromAdminPath,
} from "@/lib/admin-session";
import { defaultLocale } from "@/config/i18n";
import { getAdminProgramCoverImageById } from "@/services/programs/program-service";
import type { ProgramCoverImageState } from "@/types/program";

type ProgramCoverImageRouteContext = {
  params: Promise<{ id: string }>;
};

function buildNotFoundResponse() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function resolveDraftRedirectLocale(request: NextRequest) {
  const referer = request.headers.get("referer");

  if (!referer) {
    return defaultLocale;
  }

  try {
    const refererUrl = new URL(referer);

    return resolveLocaleFromAdminPath(refererUrl.pathname) ?? defaultLocale;
  } catch {
    return defaultLocale;
  }
}

function parseCoverImageState(request: NextRequest): ProgramCoverImageState | null {
  const state = request.nextUrl.searchParams.get("state") ?? "published";

  return state === "draft" || state === "published" ? state : null;
}

export async function GET(request: NextRequest, { params }: ProgramCoverImageRouteContext) {
  const { id } = await params;
  const state = parseCoverImageState(request);

  if (!state) {
    return buildNotFoundResponse();
  }

  if (state === "draft") {
    const session = await readAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);

    if (!session) {
      const locale = resolveDraftRedirectLocale(request);
      return NextResponse.redirect(new URL(buildAdminLoginPath(locale), request.url));
    }
  }

  const coverImage = await getAdminProgramCoverImageById(id, state);

  if (!coverImage) {
    return buildNotFoundResponse();
  }

  const body = new Blob(
    [
      coverImage.data.buffer.slice(
        coverImage.data.byteOffset,
        coverImage.data.byteOffset + coverImage.data.byteLength,
      ) as ArrayBuffer,
    ],
    { type: coverImage.contentType },
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "cache-control": state === "draft" ? "private, no-store" : "public, no-store",
      "content-length": String(coverImage.sizeBytes),
      "content-type": coverImage.contentType,
    },
  });
}
