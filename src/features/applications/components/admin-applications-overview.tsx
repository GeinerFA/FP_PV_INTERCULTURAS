import { getLocale, getTranslations } from "next-intl/server";

import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
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

export async function AdminApplicationsOverview() {
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
      summary[status] = applications.filter((application) => application.status === status).length;
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
          </article>
        ))}
      </div>

      <AdminWorkspaceSection title={t("heading")} description={t("description")} contentClassName="px-0 pb-0">
        <div className="overflow-x-auto">
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
              {applications.map((application) => (
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
        </div>
      </AdminWorkspaceSection>
    </div>
  );
}
