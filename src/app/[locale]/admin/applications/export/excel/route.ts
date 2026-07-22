import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import {
  buildAdminApplicationsExportFileName,
  buildAdminApplicationsWorkbook,
  type AdminApplicationExportCopy,
} from "@/features/applications/admin-application-export";
import { normalizeAdminApplicationListFilters } from "@/features/applications/admin-application-list-filters";
import { buildAdminLoginPath, readAdminSessionToken, resolveLocaleFromAdminPath } from "@/lib/admin-session";
import { listApplications } from "@/services/applications/application-service";
import type { AppLocale } from "@/config/i18n";

function buildExportCopy(
  tList: Awaited<ReturnType<typeof getTranslations>>,
  tDetail: Awaited<ReturnType<typeof getTranslations>>,
): AdminApplicationExportCopy {
  return {
    title: tList("filters.exportTitle"),
    summaryTitle: tList("filters.exportSummaryTitle"),
    generatedAtLabel: tList("filters.exportGeneratedAtLabel"),
    filtersLabel: tList("filters.exportFiltersLabel"),
    noFiltersLabel: tList("filters.exportNoFiltersLabel"),
    resultCountLabel: tList("filters.exportResultCountLabel"),
    worksheetName: tList("filters.exportWorksheetName"),
    applicationHeading: tList("filters.exportApplicationHeading"),
    statusesSummaryLabel: tList("filters.exportStatusesSummaryLabel"),
    exportUnavailableMessage: tList("filters.exportUnavailableMessage"),
    fields: {
      id: tList("filters.exportFields.id"),
      status: tList("filters.exportFields.status"),
      applicationType: tList("filters.exportFields.applicationType"),
      applicationTypeCode: tList("filters.exportFields.applicationTypeCode"),
      applicationTypeName: tList("filters.exportFields.applicationTypeName"),
      submittedAt: tList("filters.exportFields.submittedAt"),
      updatedAt: tList("filters.exportFields.updatedAt"),
      firstName: tList("filters.exportFields.firstName"),
      lastName: tList("filters.exportFields.lastName"),
      fullName: tList("filters.exportFields.fullName"),
      email: tDetail("fields.email"),
      phone: tDetail("fields.phone"),
      nationality: tDetail("fields.nationality"),
      residenceCountry: tList("filters.exportFields.residenceCountry"),
      residenceCity: tList("filters.exportFields.residenceCity"),
      birthDate: tDetail("fields.birthDate"),
      identityDocument: tList("filters.exportFields.identityDocument"),
      availability: tDetail("fields.availability"),
      message: tDetail("fields.message"),
      curriculum: tDetail("fields.curriculum"),
      curriculumFileName: tList("filters.exportFields.curriculumFileName"),
      curriculumContentType: tList("filters.exportFields.curriculumContentType"),
      curriculumSize: tList("filters.exportFields.curriculumSize"),
      curriculumUploadedAt: tList("filters.exportFields.curriculumUploadedAt"),
      statusHistory: tList("filters.exportFields.statusHistory"),
      applicationTypeHistory: tList("filters.exportFields.applicationTypeHistory"),
    },
    filters: {
      query: tList("filters.searchLabel"),
      status: tList("filters.statusLabel"),
      applicationType: tList("filters.applicationTypeLabel"),
      from: tList("filters.fromLabel"),
      to: tList("filters.toLabel"),
    },
    placeholders: {
      empty: "—",
      none: tList("filters.exportNoneLabel"),
      available: tList("filters.exportAvailableLabel"),
    },
    statuses: {
      pending: tList("statuses.pending"),
      in_process: tList("statuses.in_process"),
      resolved: tList("statuses.resolved"),
      cancelled: tList("statuses.cancelled"),
    },
    applicationTypes: {
      volunteering: tList("applicationTypes.volunteering"),
    },
  };
}

export async function GET(request: NextRequest) {
  const locale = (resolveLocaleFromAdminPath(request.nextUrl.pathname) ?? "es") as AppLocale;
  const session = await readAdminSessionToken(request.cookies.get("fp_pv_admin_session")?.value);

  if (!session) {
    return NextResponse.redirect(
      new URL(buildAdminLoginPath(locale, `${request.nextUrl.pathname}${request.nextUrl.search}`), request.url),
    );
  }

  const filters = normalizeAdminApplicationListFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const applications = await listApplications(filters);

  if (applications.length === 0) {
    const tList = await getTranslations({ locale, namespace: "ApplicationFlow.admin.list" });

    return new NextResponse(tList("filters.exportUnavailableMessage"), {
      status: 409,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  const [tList, tDetail] = await Promise.all([
    getTranslations({ locale, namespace: "ApplicationFlow.admin.list" }),
    getTranslations({ locale, namespace: "ApplicationFlow.admin.detail" }),
  ]);
  const copy = buildExportCopy(tList, tDetail);
  const workbook = await buildAdminApplicationsWorkbook({
    applications,
    copy,
    filters,
    locale,
  });
  const workbookBody = workbook.buffer.slice(
    workbook.byteOffset,
    workbook.byteOffset + workbook.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(
    new Blob([workbookBody], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    {
      status: 200,
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="${buildAdminApplicationsExportFileName("xlsx")}"`,
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    },
  );
}
