import { getLocale, getTranslations } from "next-intl/server";

import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { Link } from "@/i18n/navigation";
import { listApplications } from "@/services/applications/application-service";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";

const statusTheme: Record<ApplicationStatus, string> = {
  pending: "bg-amber-500/12 text-amber-100 ring-amber-400/30",
  in_process: "bg-violet-500/12 text-violet-100 ring-violet-400/30",
  resolved: "bg-emerald-500/12 text-emerald-100 ring-emerald-400/30",
  cancelled: "bg-rose-500/12 text-rose-100 ring-rose-400/30",
};

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function AdminApplicationsOverview() {
  const [applications, locale, t] = await Promise.all([
    listApplications(),
    getLocale(),
    getTranslations("ApplicationFlow.admin.list"),
  ]);

  if (applications.length === 0) {
    return (
      <AdminWorkspaceSection
        eyebrow={t("empty.eyebrow")}
        title={t("empty.title")}
        description={t("empty.description")}
        tone="subtle"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-300">{t("empty.note")}</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t(`statuses.${status}`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-50">{counts[status]}</p>
          </article>
        ))}
      </div>

      <AdminWorkspaceSection title={t("heading")} description={t("description")} contentClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="admin-inner-table-shell min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
            <thead className="bg-slate-950/35 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.applicant")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.contact")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.submittedAt")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/80 bg-transparent">
              {applications.map((application) => (
                <tr key={application.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-50">{application.fullName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {application.applicationType.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{application.nationality}</p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    <p>{application.email}</p>
                    <p className="mt-2 text-slate-300">{application.phone}</p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">{formatDate(application.createdAt, locale)}</td>
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
                      className="inline-flex rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800/80"
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
