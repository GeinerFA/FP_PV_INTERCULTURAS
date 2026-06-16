import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { LocalizedProgram } from "@/types/program";

const categoryTheme = {
  volunteer: "bg-emerald-200 text-emerald-900",
  internships: "bg-sky-200 text-sky-900",
  "spanish-classes": "bg-amber-200 text-amber-900",
} as const;

type PublicProgramDetailProps = {
  program: LocalizedProgram;
};

export async function PublicProgramDetail({ program }: PublicProgramDetailProps) {
  const t = await getTranslations("ProgramsUi");

  return (
    <article className="rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.4)]">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            {program.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{program.shortDescription}</p>
          <p className="mt-6 text-base leading-8 text-slate-700">{program.fullDescription}</p>
        </div>

        <aside className="rounded-3xl bg-emerald-100/70 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("labels.programSnapshot")}
          </h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-900">{t("labels.location")}</dt>
              <dd className="mt-1 text-slate-600">{program.location}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t("labels.duration")}</dt>
              <dd className="mt-1 text-slate-600">{program.duration}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t("labels.availability")}</dt>
              <dd className="mt-1 text-slate-600">{program.availability}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-emerald-200 bg-emerald-100/70 p-6">
          <h3 className="text-lg font-semibold text-slate-950">{t("labels.requirements")}</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {program.requirements.map((requirement) => (
              <li key={requirement} className="rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
                {requirement}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-100/70 p-6">
          <h3 className="text-lg font-semibold text-slate-950">{t("labels.included")}</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {program.included.map((item) => (
              <li key={item} className="rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-emerald-200 pt-6">
        <Link
          href="/programs"
          className="inline-flex rounded-full border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-950"
        >
          {t("backToPrograms")}
        </Link>
        <Link
          href="/apply"
          className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("applyNow")}
        </Link>
      </div>
    </article>
  );
}
