import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { listApplications } from "@/services/applications/application-service";
import { listAdminPrograms } from "@/services/programs/program-service";

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export async function AdminDashboardOverview() {
  const [applications, programs, locale, t] = await Promise.all([
    listApplications(),
    listAdminPrograms(),
    getLocale(),
    getTranslations("AdminDashboardOverview"),
  ]);

  const activeLocale = locale as AppLocale;
  const pendingApplications = applications.filter((application) => application.status === "pending").length;
  const inProcessApplications = applications.filter((application) => application.status === "in_process").length;
  const publishedPrograms = programs.filter((program) => program.status === "published").length;
  const draftPrograms = programs.filter((program) => program.status === "draft").length;
  const recentApplications = applications.slice(0, 3);
  const recentPrograms = programs.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-dark-soft rounded-3xl p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                {t("applications.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{t("applications.title")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t("applications.description")}</p>
            </div>
            <Link
              href="/admin/applications"
              className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-200"
            >
              {t("applications.cta")}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { key: "total", value: applications.length },
              { key: "pending", value: pendingApplications },
              { key: "inProcess", value: inProcessApplications },
            ].map((item) => (
              <article key={item.key} className="surface-dark-panel rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t(`applications.stats.${item.key}.label`)}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-400">{t(`applications.stats.${item.key}.description`)}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("applications.recentHeading")}
            </h3>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="surface-dark-panel-muted flex flex-col gap-3 rounded-2xl px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{application.fullName}</p>
                      <p className="mt-1 text-sm text-slate-400">{application.email}</p>
                    </div>
                    <div className="text-sm text-slate-300 md:text-right">
                      <p>{t(`applications.statuses.${application.status}`)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {formatDate(application.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-dark-panel-muted rounded-2xl px-4 py-4 text-sm leading-6 text-slate-300">
                {t("applications.empty")}
              </div>
            )}
          </div>
        </section>

        <section className="surface-dark-soft rounded-3xl p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                {t("programs.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{t("programs.title")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t("programs.description")}</p>
            </div>
            <Link
              href="/admin/programs"
              className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal-400 hover:text-teal-200"
            >
              {t("programs.cta")}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { key: "total", value: programs.length },
              { key: "published", value: publishedPrograms },
              { key: "drafts", value: draftPrograms },
            ].map((item) => (
              <article key={item.key} className="surface-dark-panel rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t(`programs.stats.${item.key}.label`)}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-400">{t(`programs.stats.${item.key}.description`)}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("programs.recentHeading")}
            </h3>
            {recentPrograms.length > 0 ? (
              <div className="space-y-3">
                {recentPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="surface-dark-panel-muted flex flex-col gap-3 rounded-2xl px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{program.translations[activeLocale].title}</p>
                      <p className="mt-1 text-sm text-slate-400">/{program.slug}</p>
                    </div>
                    <div className="text-sm text-slate-300 md:text-right">
                      <p>{t(`programs.statuses.${program.status}`)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {formatDate(program.updatedAt, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-dark-panel-muted rounded-2xl px-4 py-4 text-sm leading-6 text-slate-300">
                {t("programs.empty")}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
