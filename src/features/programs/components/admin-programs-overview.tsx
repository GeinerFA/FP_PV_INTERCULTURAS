import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { listAdminPrograms } from "@/services/programs/program-service";

const statusTheme = {
  draft: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  published: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
} as const;

export async function AdminProgramsOverview() {
  const [programs, t, locale] = await Promise.all([
    listAdminPrograms(),
    getTranslations("AdminProgramsOverview"),
    getLocale(),
  ]);
  const activeLocale = locale as AppLocale;
  const publishedCount = programs.filter((program) => program.status === "published").length;
  const featuredCount = programs.filter((program) => program.featured).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("stats.catalogSize.label")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{programs.length}</p>
          <p className="mt-2 text-sm text-slate-400">{t("stats.catalogSize.description")}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("stats.publishedNow.label")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{publishedCount}</p>
          <p className="mt-2 text-sm text-slate-400">{t("stats.publishedNow.description")}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("stats.featuredHighlights.label")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{featuredCount}</p>
          <p className="mt-2 text-sm text-slate-400">{t("stats.featuredHighlights.description")}</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("table.heading")}</h2>
            <p className="mt-2 text-sm text-slate-400">{t("table.description")}</p>
          </div>
          <Link
            href="/admin/programs/new"
            className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            {t("table.newProgram")}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.program")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.category")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.featured")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.availability")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {programs.map((program) => (
                <tr key={program.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-white">{program.translations[activeLocale].title}</p>
                    <p className="mt-1 text-xs text-slate-400">/{program.slug}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-400">
                      {program.translations[activeLocale].shortDescription}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    {t(`categories.${program.category}`)}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                    >
                      {t(`statuses.${program.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-200">
                    {program.featured ? t("yes") : t("no")}
                  </td>
                  <td className="px-6 py-5 text-slate-200">{program.availability[activeLocale]}</td>
                  <td className="px-6 py-5">
                    <Link
                      href={{
                        pathname: "/admin/programs/[id]/edit",
                        params: { id: program.id },
                      }}
                      className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      {t("table.openEditor")}
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
