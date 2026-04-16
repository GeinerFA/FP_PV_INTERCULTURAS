import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { listPublicPrograms } from "@/services/programs/program-service";

const categoryTheme = {
  volunteer: "bg-emerald-100 text-emerald-800",
  internships: "bg-sky-100 text-sky-800",
  "spanish-classes": "bg-amber-100 text-amber-800",
} as const;

type PublicProgramsCatalogProps = {
  locale: AppLocale;
};

export async function PublicProgramsCatalog({ locale }: PublicProgramsCatalogProps) {
  const [programs, t] = await Promise.all([
    listPublicPrograms(locale),
    getTranslations("ProgramsUi"),
  ]);

  if (programs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {programs.map((program) => (
        <article
          key={program.id}
          className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${categoryTheme[program.category]}`}
            >
              {t(`categories.${program.category}`)}
            </span>
            {program.featured ? (
              <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                {t("featured")}
              </span>
            ) : null}
          </div>

          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            {program.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{program.shortDescription}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("labels.location")}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">{program.location}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("labels.duration")}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">{program.duration}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("labels.availability")}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">{program.availability}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">{program.seoDescription}</p>
            <Link
              href={{ pathname: "/programs/[slug]", params: { slug: program.slug } }}
              className="inline-flex shrink-0 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              {t("viewDetails")}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
