import { getLocale, getTranslations } from "next-intl/server";

import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import {
  buildAdminApplicationListQuery,
  countActiveAdminApplicationListFilters,
  filterAdminApplications,
  hasActiveAdminApplicationListFilters,
  type AdminApplicationListFilters,
} from "@/features/applications/admin-application-list-filters";
import { AdminApplicationsFilterShell } from "@/features/applications/components/admin-applications-filter-shell";
import { Link } from "@/i18n/navigation";
import { listApplications } from "@/services/applications/application-service";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";

const statusTheme: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  in_process: "bg-violet-50 text-violet-700 ring-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ExportFormat = "excel" | "pdf";

function ExportFormatIcon({ format }: { format: ExportFormat }) {
  const palette =
    format === "excel"
      ? {
          stroke: "#047857",
          fill: "#ecfdf5",
          glow: "rgba(16, 185, 129, 0.22)",
        }
      : {
          stroke: "#be123c",
          fill: "#fff1f2",
          glow: "rgba(244, 63, 94, 0.22)",
        };

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-white/80 bg-white/90 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]"
      style={{ boxShadow: `0 10px 24px -18px ${palette.glow}` }}
    >
      <svg viewBox="0 0 48 48" className="h-4 w-4">
        <path d="M14 6h14l8 8v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" fill={palette.fill} />
        <path d="M28 6v8h8" fill="none" stroke={palette.stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M14 6h14l8 8v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z"
          fill="none"
          stroke={palette.stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {format === "excel" ? (
          <>
            <path d="M18 19.5h10M18 24h10M18 28.5h10" stroke={palette.stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="m27.5 31.5 5-7m0 7-5-7" stroke={palette.stroke} strokeWidth="2.6" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M17.5 20.5h13M17.5 25h13" stroke={palette.stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M17.5 30h7" stroke={palette.stroke} strokeWidth="2" strokeLinecap="round" />
            <path
              d="M28.5 33c2.5 0 4.5-1.8 4.5-4.3 0-2.4-2-4.2-4.5-4.2H26V33h2.5Z"
              fill="none"
              stroke={palette.stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </span>
  );
}

function ExportActionCard({
  format,
  href,
  label,
  disabled = false,
}: {
  format: ExportFormat;
  href?: string;
  label: string;
  disabled?: boolean;
}) {
  const buttonClassName = [
    "admin-outline-action inline-flex h-11 w-11 items-center justify-center rounded-2xl transition duration-200 motion-reduce:transition-none",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-28px_rgba(15,23,42,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
  ].join(" ");

  const content = (
    <>
      <ExportFormatIcon format={format} />
      <span className="sr-only">{label}</span>
    </>
  );

  if (disabled || !href) {
    return (
      <span aria-disabled="true" title={label} className={buttonClassName}>
        {content}
      </span>
    );
  }

  return (
    <a href={href} aria-label={label} title={label} className={buttonClassName}>
      {content}
    </a>
  );
}

type AdminApplicationsOverviewProps = {
  filters: AdminApplicationListFilters;
};

export async function AdminApplicationsOverview({ filters }: AdminApplicationsOverviewProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("ApplicationFlow.admin.list")]);

  let applications: Awaited<ReturnType<typeof listApplications>>;

  try {
    applications = await listApplications();
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection
        eyebrow={t("unavailable.eyebrow")}
        title={t("unavailable.title")}
        description={t("unavailable.description")}
        tone="warning"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("unavailable.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const visibleApplications = filterAdminApplications(applications, filters);
  const hasActiveFilters = hasActiveAdminApplicationListFilters(filters);
  const activeFiltersCount = countActiveAdminApplicationListFilters(filters);
  const filterQuery = buildAdminApplicationListQuery(filters);
  const filterQueryKey = filterQuery.toString();
  const exportQuery = new URLSearchParams(filterQuery).toString();
  const exportSuffix = exportQuery ? `?${exportQuery}` : "";
  const exportUrls = {
    excel: `/${locale}/admin/applications/export/excel${exportSuffix}`,
    pdf: `/${locale}/admin/applications/export/pdf${exportSuffix}`,
  };

  if (applications.length === 0) {
    return (
      <AdminWorkspaceSection
        eyebrow={t("empty.eyebrow")}
        title={t("empty.title")}
        description={t("empty.description")}
        tone="subtle"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-600">{t("empty.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const counts = applicationStatuses.reduce<Record<ApplicationStatus, number>>(
    (summary, status) => {
      summary[status] = visibleApplications.filter((application) => application.status === status).length;
      return summary;
    },
    {
      pending: 0,
      in_process: 0,
      resolved: 0,
      cancelled: 0,
    },
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {applicationStatuses.map((status) => (
          <article key={status} className="admin-inner-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t(`statuses.${status}`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{counts[status]}</p>
            <p className="mt-2 text-sm text-slate-600">{t("summaryCardDescription")}</p>
          </article>
        ))}
      </div>

      <AdminWorkspaceSection
        title={t("heading")}
        description={t("description")}
        contentClassName="px-0 pb-0"
        action={
          hasActiveFilters ? (
            <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              {t("filters.activeBadge")}
            </span>
          ) : null
        }
      >
        <AdminApplicationsFilterShell
          key={filterQueryKey}
          copy={{
            heading: t("filters.heading"),
            description: t("filters.description"),
            disclosureClosedLabel: t("filters.disclosureClosedLabel"),
            disclosureOpenLabel: t("filters.disclosureOpenLabel"),
            disclosureHint: t("filters.disclosureHint"),
            searchLabel: t("filters.searchLabel"),
            searchPlaceholder: t("filters.searchPlaceholder"),
            statusLabel: t("filters.statusLabel"),
            applicationTypeLabel: t("filters.applicationTypeLabel"),
            fromLabel: t("filters.fromLabel"),
            toLabel: t("filters.toLabel"),
            allStatuses: t("filters.allStatuses"),
            allApplicationTypes: t("filters.allApplicationTypes"),
            applyLabel: t("filters.applyLabel"),
            applyingLabel: t("filters.applyingLabel"),
            resetLabel: t("filters.resetLabel"),
            activeBadge: t("filters.activeBadge"),
            activeSummary: t("filters.activeSummary", { count: activeFiltersCount }),
            resultsSummary: t("filters.resultsSummary", {
              count: visibleApplications.length,
              total: applications.length,
            }),
            updatingResultsLabel: t("filters.updatingResultsLabel"),
            statuses: {
              pending: t("statuses.pending"),
              in_process: t("statuses.in_process"),
              resolved: t("statuses.resolved"),
              cancelled: t("statuses.cancelled"),
            },
            applicationTypes: {
              volunteering: t("applicationTypes.volunteering"),
            },
          }}
          defaultValues={{
            query: filters.query ?? "",
            status: filters.status ?? "",
            applicationType: filters.applicationType ?? "",
            from: filters.from ?? "",
            to: filters.to ?? "",
          }}
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
        >
          {visibleApplications.length === 0 ? (
            <div className="px-6 py-8 text-sm leading-7 text-slate-600">{t("emptyFiltered")}</div>
          ) : null}
          <div className="overflow-x-auto">
            {visibleApplications.length > 0 ? (
              <table className="admin-inner-table-shell min-w-full divide-y divide-emerald-900/8 text-left text-sm text-slate-700">
                <thead className="admin-table-head text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t("columns.applicant")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.contact")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.submittedAt")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/8 bg-transparent">
                  {visibleApplications.map((application) => (
                    <tr key={application.id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{application.fullName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {application.applicationType.name}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{application.nationality}</p>
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        <p>{application.email}</p>
                        <p className="mt-2 text-slate-600">{application.phone}</p>
                      </td>
                      <td className="px-6 py-5 text-slate-700">{formatDate(application.createdAt, locale)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[application.status]}`}
                        >
                          {t(`statuses.${application.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          href={{
                            pathname: "/admin/applications/[id]",
                            params: { id: application.id },
                            query: filterQuery,
                          }}
                          className="admin-outline-action inline-flex rounded-full px-4 py-2 text-xs font-semibold transition"
                        >
                          {t("openDetail")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </AdminApplicationsFilterShell>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/8 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            {visibleApplications.length > 0 ? (
              <>
                <ExportActionCard format="excel" href={exportUrls.excel} label={t("filters.exportExcelLabel")} />
                <ExportActionCard format="pdf" href={exportUrls.pdf} label={t("filters.exportPdfLabel")} />
              </>
            ) : (
              <>
                <ExportActionCard format="excel" label={t("filters.exportExcelLabel")} disabled />
                <ExportActionCard format="pdf" label={t("filters.exportPdfLabel")} disabled />
                <span className="text-sm leading-6 text-slate-500">{t("filters.exportDisabledLabel")}</span>
              </>
            )}
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {t("filters.resultsSummary", {
              count: visibleApplications.length,
              total: applications.length,
            })}
          </p>
        </div>
      </AdminWorkspaceSection>
    </div>
  );
}
