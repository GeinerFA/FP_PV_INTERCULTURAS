import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listApplications } from "@/services/applications/application-service";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";

const statusTheme: Record<ApplicationStatus, string> = {
  pending: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  in_process: "bg-violet-500/10 text-violet-200 ring-violet-500/30",
  resolved: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-200 ring-rose-500/30",
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
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/30 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">{t("empty.title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {t("empty.description")}
        </p>
      </div>
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
          <article key={status} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t(`statuses.${status}`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{counts[status]}</p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">{t("heading")}</h2>
          <p className="mt-2 text-sm text-slate-400">{t("description")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.applicant")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.contact")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.submittedAt")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {applications.map((application) => (
                <tr key={application.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-white">{application.fullName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {application.applicationType.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">{application.nationality}</p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    <p>{application.email}</p>
                    <p className="mt-2 text-slate-400">{application.phone}</p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    {formatDate(application.createdAt, locale)}
                  </td>
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
                      className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      {t("openDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
