import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { listPublicPrograms } from "@/services/programs/program-service";

const categoryTheme = {
  volunteer: "bg-emerald-200 text-emerald-900",
  internships: "bg-sky-200 text-sky-900",
  "spanish-classes": "bg-amber-200 text-amber-900",
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
      <div className="max-w-2xl text-sm leading-7 text-slate-600">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {programs.map((program) => (
        <article
          key={program.id}
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- program cover images must support both internal uploads and legacy external URLs without depending on remote image config. */}
          <img
            src={program.coverImage}
            alt={program.title}
            className="h-56 w-full object-cover"
            loading="lazy"
          />

          <div className="flex h-full flex-col px-6 py-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${categoryTheme[program.category]}`}
              >
                {t(`categories.${program.category}`)}
              </span>
              {program.featured ? (
                <span className="inline-flex rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">
                  {t("featured")}
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              {program.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{program.shortDescription}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.location")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">{program.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.duration")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">{program.duration}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.availability")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">{program.availability}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center justify-between gap-4 pt-3">
              <p className="text-sm text-slate-500">{program.seoDescription}</p>
              <Link
                href={{ pathname: "/programs/[slug]", params: { slug: program.slug } }}
                className="inline-flex shrink-0 rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {t("viewDetails")}
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
