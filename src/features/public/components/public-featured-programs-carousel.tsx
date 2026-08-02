"use client";

import { useEffect, useId, useState } from "react";

import { getProgramCategoryBadgeClassName, getProgramCategoryName } from "@/features/programs/lib/program-category-presentation";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { LocalizedProgram } from "@/types/program";

type PublicFeaturedProgramsCarouselProps = {
  featuredPrograms: LocalizedProgram[];
  featuredHeadingId: string;
  labels: {
    featured: string;
    viewProgram: string;
    previousPrograms: string;
    nextPrograms: string;
    location: string;
    duration: string;
    availability: string;
  };
};

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M11.5 4.5 6 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M8.5 4.5 14 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 10h-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getVisibleCardCount(viewportWidth: number) {
  if (viewportWidth >= 1024) {
    return 3;
  }

  if (viewportWidth >= 768) {
    return 2;
  }

  return 1;
}

export function PublicFeaturedProgramsCarousel({
  featuredPrograms,
  featuredHeadingId,
  labels,
}: PublicFeaturedProgramsCarouselProps) {
  const [rawCurrentIndex, setRawCurrentIndex] = useState(0);
  const [visibleCardCount, setVisibleCardCount] = useState(3);
  const trackId = useId();
  const hasNavigation = featuredPrograms.length > 3;
  const maxStartIndex = Math.max(0, featuredPrograms.length - visibleCardCount);
  const currentIndex = Math.min(rawCurrentIndex, maxStartIndex);

  useEffect(() => {
    const syncVisibleCardCount = () => {
      setVisibleCardCount(getVisibleCardCount(window.innerWidth));
    };

    syncVisibleCardCount();
    window.addEventListener("resize", syncVisibleCardCount);

    return () => {
      window.removeEventListener("resize", syncVisibleCardCount);
    };
  }, []);

  return (
    <div className="mt-8" role="region" aria-labelledby={featuredHeadingId}>
      {hasNavigation ? (
        <div className="mb-5 flex items-center justify-end gap-3">
          <button
            type="button"
            aria-label={labels.previousPrograms}
            aria-controls={trackId}
            onClick={() => setRawCurrentIndex((current) => Math.max(0, Math.min(current, maxStartIndex) - 1))}
            disabled={currentIndex === 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={labels.nextPrograms}
            aria-controls={trackId}
            onClick={() => setRawCurrentIndex((current) => Math.min(maxStartIndex, current + 1))}
            disabled={currentIndex >= maxStartIndex}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden md:-mx-4">
        <div
          id={trackId}
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / visibleCardCount)}%)` }}
        >
          {featuredPrograms.map((program) => (
            <article
              key={program.id}
              className="w-full shrink-0 px-0 md:w-1/2 md:px-4 lg:w-1/3 lg:px-4"
            >
              <div className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-3 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)]">
                <div
                  className="h-44 rounded-[1.75rem] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.14), rgba(15, 23, 42, 0.24)), url(${program.coverImage})` }}
                />
                <div className="px-3 py-5">
                  <div className="flex flex-wrap gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getProgramCategoryBadgeClassName(program.categoryDetails)}`}
                    >
                      {getProgramCategoryName(program.categoryDetails, program.category)}
                    </span>
                    <span className="inline-flex rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">
                      {labels.featured}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    {program.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{program.shortDescription}</p>

                  <dl className="mt-6 grid gap-4 border-t border-slate-200/80 pt-5 text-sm sm:grid-cols-3 lg:grid-cols-1">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {labels.location}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.location}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {labels.duration}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.duration}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {labels.availability}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.availability}</dd>
                    </div>
                  </dl>

                  <LocaleLink
                    href={{ pathname: "/programs/[slug]", params: { slug: program.slug } }}
                    className="mt-6 inline-flex rounded-full border border-emerald-300 bg-emerald-100/80 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100"
                  >
                    {labels.viewProgram}
                  </LocaleLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
