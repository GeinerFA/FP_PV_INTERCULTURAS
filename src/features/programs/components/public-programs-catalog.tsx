import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { getProgramCategoryBadgeClassName, getProgramCategoryName } from "@/features/programs/lib/program-category-presentation";
import { Link } from "@/i18n/navigation";
import { listPublicPrograms } from "@/services/programs/program-service";

type PublicProgramsCatalogProps = {
  locale: AppLocale;
};

type ProgramSummarySource = {
  shortDescription: string;
  fullDescription: string;
};

function truncateProgramSummary(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength - 1).trimEnd();
  const lastSpaceIndex = clipped.lastIndexOf(" ");

  return `${(lastSpaceIndex > 0 ? clipped.slice(0, lastSpaceIndex) : clipped).trimEnd()}…`;
}

function getVisibleProgramSummary(program: ProgramSummarySource) {
  const fullDescription = program.fullDescription.trim();
  const shortDescription = program.shortDescription.trim();

  if (!fullDescription || fullDescription === shortDescription) {
    return shortDescription;
  }

  const firstSentence = fullDescription.match(/^.+?[.!?](?=\s|$)/u)?.[0]?.trim();

  return truncateProgramSummary(firstSentence || fullDescription, 170);
}

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
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      {programs.map((program) => (
        <article
          key={program.id}
          className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/84 p-3 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)] backdrop-blur-sm"
        >
          <div className="relative overflow-hidden rounded-[1.75rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- program cover images must support both internal uploads and legacy external URLs without depending on remote image config. */}
            <img
              src={program.coverImage}
              alt={program.title}
              className="h-60 w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-900/20 to-white/10" />
            <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-3 p-5">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm ${getProgramCategoryBadgeClassName(program.categoryDetails)}`}
              >
                {getProgramCategoryName(program.categoryDetails, program.category)}
              </span>
              {program.featured ? (
                <span className="inline-flex rounded-full bg-white/88 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900 shadow-sm">
                  {t("featured")}
                </span>
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white md:text-[1.9rem]">
                {program.title}
              </h2>
            </div>
          </div>

          <div className="flex h-full flex-col px-4 pb-4 pt-6 md:px-5 md:pb-5">
            <p className="text-base leading-7 text-slate-700">{program.shortDescription}</p>

            <dl className="mt-6 grid gap-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-5 sm:grid-cols-3">
              <div className="space-y-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.location")}
                </dt>
                <dd className="text-sm font-medium leading-6 text-slate-900">{program.location}</dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.duration")}
                </dt>
                <dd className="text-sm font-medium leading-6 text-slate-900">{program.duration}</dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("labels.availability")}
                </dt>
                <dd className="text-sm font-medium leading-6 text-slate-900">{program.availability}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("labels.programSnapshot")}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {getVisibleProgramSummary(program)}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-end border-t border-slate-200/80 pt-5">
              <Link
                href={{ pathname: "/programs/[slug]", params: { slug: program.slug } }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
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
