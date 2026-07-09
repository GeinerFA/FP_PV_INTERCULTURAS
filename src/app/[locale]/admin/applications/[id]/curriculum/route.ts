import { NextRequest, NextResponse } from "next/server";

import { buildAdminLoginPath, readAdminSessionToken, resolveLocaleFromAdminPath } from "@/lib/admin-session";
import { getApplicationCurriculumById } from "@/services/applications/application-service";

type CurriculumRouteContext = {
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

function buildContentDispositionFileName(fileName: string): string {
  return fileName.replace(/[/\\"]/g, "-");
}

export async function GET(request: NextRequest, { params }: CurriculumRouteContext) {
  const { id } = await params;
  const locale = resolveLocaleFromAdminPath(request.nextUrl.pathname) ?? "es";
  const session = await readAdminSessionToken(request.cookies.get("fp_pv_admin_session")?.value);

  if (!session) {
    return NextResponse.redirect(
      new URL(buildAdminLoginPath(locale, request.nextUrl.pathname), request.url),
    );
  }

  const curriculum = await getApplicationCurriculumById(id);

  if (!curriculum) {
    return buildNotFoundResponse();
  }

  const body = new Blob(
    [
      curriculum.data.buffer.slice(
        curriculum.data.byteOffset,
        curriculum.data.byteOffset + curriculum.data.byteLength,
      ) as ArrayBuffer,
    ],
    { type: curriculum.contentType },
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${buildContentDispositionFileName(curriculum.fileName)}"`,
      "content-length": String(curriculum.sizeBytes),
      "content-type": curriculum.contentType,
    },
  });
}
