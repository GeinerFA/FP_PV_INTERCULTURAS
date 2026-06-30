import { NextResponse } from "next/server";

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

export async function GET(_request: Request, { params }: CurriculumRouteContext) {
  const { id } = await params;
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
