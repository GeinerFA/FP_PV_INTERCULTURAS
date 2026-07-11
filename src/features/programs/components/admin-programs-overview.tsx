import { getLocale, getTranslations } from "next-intl/server";

import { archiveProgramAction, reactivateProgramAction } from "@/app/[locale]/admin/programs/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { Link } from "@/i18n/navigation";
import { listAdminPrograms } from "@/services/programs/program-service";

const statusTheme = {
  draft: "bg-amber-500/12 text-amber-100 ring-amber-400/30",
  published: "bg-emerald-500/12 text-emerald-100 ring-emerald-400/30",
  archived: "bg-slate-500/12 text-slate-200 ring-slate-400/30",
} as const;

export async function AdminProgramsOverview() {
  const [programs, t, locale] = await Promise.all([
    listAdminPrograms(),
    getTranslations("AdminProgramsOverview"),
    getLocale(),
  ]);
  const activeLocale = locale as AppLocale;
  const publishedCount = programs.filter((program) => program.status === "published").length;
  const draftCount = programs.filter((program) => program.status === "draft").length;
  const archivedCount = programs.filter((program) => program.status === "archived").length;
  const categoryCounts = {
    volunteer: programs.filter((program) => program.category === "volunteer").length,
    internships: programs.filter((program) => program.category === "internships").length,
    "spanish-classes": programs.filter((program) => program.category === "spanish-classes").length,
  } as const;

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          {[
            { key: "catalogSize", value: 0 },
            { key: "publishedNow", value: 0 },
            { key: "draftBacklog", value: 0 },
            { key: "archivedNow", value: 0 },
          ].map((item) => (
            <article key={item.key} className="admin-inner-panel rounded-[28px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t(`stats.${item.key}.label`)}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-50">{item.value}</p>
              <p className="mt-2 text-sm text-slate-300">{t(`stats.${item.key}.description`)}</p>
            </article>
          ))}
        </div>

        <AdminWorkspaceSection
          eyebrow={t("empty.eyebrow")}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Link
              href="/admin/programs/new"
              className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              {t("empty.cta")}
            </Link>
          }
          tone="default"
        >
          <p className="max-w-3xl text-sm leading-7 text-slate-300">{t("empty.note")}</p>
        </AdminWorkspaceSection>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { key: "catalogSize", value: programs.length },
          { key: "publishedNow", value: publishedCount },
          { key: "draftBacklog", value: draftCount },
          { key: "archivedNow", value: archivedCount },
        ].map((item) => (
          <article key={item.key} className="admin-inner-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t(`stats.${item.key}.label`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-50">{item.value}</p>
            <p className="mt-2 text-sm text-slate-300">{t(`stats.${item.key}.description`)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <AdminWorkspaceSection title={t("summary.heading")} description={t("summary.description")}>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="admin-inner-panel-subtle rounded-2xl px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t(`categories.${category as keyof typeof categoryCounts}`)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{count}</p>
              </div>
            ))}
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={t("actions.heading")} description={t("actions.description")}>
          <div className="space-y-3 text-sm leading-7 text-slate-200">
            <Link
              href="/admin/programs/new"
              className="inline-flex w-full items-center justify-center rounded-full bg-teal-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              {t("actions.create")}
            </Link>
            <p className="admin-inner-panel-subtle rounded-2xl px-4 py-3 text-sm leading-6 text-slate-300">
              {t("actions.note")}
            </p>
          </div>
        </AdminWorkspaceSection>
      </div>

      <AdminWorkspaceSection
        title={t("table.heading")}
        description={t("table.description")}
        action={
          <Link
            href="/admin/programs/new"
            className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            {t("table.newProgram")}
          </Link>
        }
        className="border-slate-600/40 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))] shadow-[0_32px_80px_-58px_rgba(2,6,23,1)]"
        contentClassName="px-0 pb-0"
        >
          <div className="overflow-x-auto">
          <table className="admin-inner-table-shell min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
            <thead className="bg-slate-950/35 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.program")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.category")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.featured")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.availability")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/80 bg-transparent">
              {programs.map((program) => (
                <tr key={program.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-50">{program.translations[activeLocale].title}</p>
                    <p className="mt-1 text-xs text-slate-400">/{program.slug}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-300">
                      {program.translations[activeLocale].shortDescription}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">{t(`categories.${program.category}`)}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                    >
                      {t(`statuses.${program.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    <span className="inline-flex rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                      {program.featured ? t("yes") : t("no")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-200">{program.availability[activeLocale]}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={{
                          pathname: "/admin/programs/[id]/edit",
                          params: { id: program.id },
                        }}
                        className="inline-flex rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800/80"
                      >
                        {t("table.openEditor")}
                      </Link>
                      {program.status === "archived" ? (
                        <form action={reactivateProgramAction.bind(null, activeLocale, program.id)}>
                          <button
                            type="submit"
                            className="inline-flex rounded-full border border-sky-500/40 px-4 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/12"
                          >
                            {t("table.reactivate")}
                          </button>
                        </form>
                      ) : (
                        <form action={archiveProgramAction.bind(null, activeLocale, program.id)}>
                          <button
                            type="submit"
                            className="inline-flex rounded-full border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/12"
                          >
                            {t("table.archive")}
                          </button>
                        </form>
                      )}
                    </div>
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
