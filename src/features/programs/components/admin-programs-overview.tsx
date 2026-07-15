import { getLocale, getTranslations } from "next-intl/server";

import { archiveProgramAction, reactivateProgramAction } from "@/app/[locale]/admin/programs/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { Link } from "@/i18n/navigation";
import { listAdminPrograms } from "@/services/programs/program-service";

const statusTheme = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t(`stats.${item.key}.label`)}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{t(`stats.${item.key}.description`)}</p>
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
              className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
            >
              {t("empty.cta")}
            </Link>
          }
          tone="default"
        >
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{t("empty.note")}</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t(`stats.${item.key}.label`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{t(`stats.${item.key}.description`)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <AdminWorkspaceSection title={t("summary.heading")} description={t("summary.description")}>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="admin-inner-panel-subtle rounded-2xl px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t(`categories.${category as keyof typeof categoryCounts}`)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{count}</p>
              </div>
            ))}
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={t("actions.heading")} description={t("actions.description")}>
          <div className="space-y-3 text-sm leading-7 text-slate-700">
            <Link
              href="/admin/programs/new"
              className="admin-primary-action inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold transition"
            >
              {t("actions.create")}
            </Link>
            <p className="admin-inner-panel-subtle rounded-2xl px-4 py-3 text-sm leading-6 text-slate-600">
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
            className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
          >
            {t("table.newProgram")}
          </Link>
        }
        className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,232,0.84))] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.14)]"
        contentClassName="px-0 pb-0"
        >
          <div className="overflow-x-auto">
          <table className="admin-inner-table-shell min-w-full divide-y divide-emerald-900/8 text-left text-sm text-slate-700">
            <thead className="admin-table-head text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.program")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.category")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.featured")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.availability")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/8 bg-transparent">
              {programs.map((program) => (
                <tr key={program.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-950">{program.translations[activeLocale].title}</p>
                    <p className="mt-1 text-xs text-slate-500">/{program.slug}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-600">
                      {program.translations[activeLocale].shortDescription}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate-700">{t(`categories.${program.category}`)}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                    >
                      {t(`statuses.${program.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {program.featured ? t("yes") : t("no")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-700">{program.availability[activeLocale]}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={{
                          pathname: "/admin/programs/[id]/edit",
                          params: { id: program.id },
                        }}
                        className="admin-outline-action inline-flex rounded-full px-4 py-2 text-xs font-semibold transition"
                      >
                        {t("table.openEditor")}
                      </Link>
                      {program.status === "archived" ? (
                        <form action={reactivateProgramAction.bind(null, activeLocale, program.id)}>
                          <button
                            type="submit"
                            className="admin-info-action inline-flex rounded-full px-4 py-2 text-xs font-semibold transition"
                          >
                            {t("table.reactivate")}
                          </button>
                        </form>
                      ) : (
                        <form action={archiveProgramAction.bind(null, activeLocale, program.id)}>
                          <button
                            type="submit"
                            className="admin-danger-action inline-flex rounded-full px-4 py-2 text-xs font-semibold transition"
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
