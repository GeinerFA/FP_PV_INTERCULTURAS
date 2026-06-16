import Link from "next/link";
import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link as LocaleLink } from "@/i18n/navigation";
import { listFeaturedPublicPrograms } from "@/services/programs/program-service";

type HomeMessages = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    contactAction: string;
  };
  story: {
    eyebrow: string;
    title: string;
    description: string;
    points: Record<string, string>;
  };
  history: {
    eyebrow: string;
    title: string;
    description: string;
    milestones: Record<
      string,
      {
        year: string;
        title: string;
        description: string;
      }
    >;
  };
  offerings: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Record<
      string,
      {
        title: string;
        description: string;
      }
    >;
  };
  info: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Record<
      string,
      {
        title: string;
        description: string;
      }
    >;
  };
  featured: {
    eyebrow: string;
    title: string;
    description: string;
    featuredLabel: string;
    browsePrograms: string;
    viewProgram: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  cta: {
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    cards: Record<
      string,
      {
        title: string;
        description: string;
      }
    >;
    actions: {
      programs: string;
      apply: string;
      faqs: string;
    };
  };
};

const categoryTheme = {
  volunteer: "bg-emerald-200 text-emerald-900",
  internships: "bg-sky-200 text-sky-900",
  "spanish-classes": "bg-amber-200 text-amber-900",
} as const;

type PublicHomePageProps = {
  locale: AppLocale;
};

export async function PublicHomePage({ locale }: PublicHomePageProps) {
  const [messages, featuredPrograms] = await Promise.all([
    getMessages(),
    listFeaturedPublicPrograms(locale),
  ]);

  const home = messages.Home as HomeMessages;
  const programsUi = messages.ProgramsUi as {
    categories: Record<string, string>;
    labels: {
      location: string;
      duration: string;
      availability: string;
    };
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="animate-fade-up relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#cdebd8_0%,#f8fbf8_54%,#f6dfad_100%)] px-8 py-10 text-slate-900 shadow-[0_24px_70px_-48px_rgba(21,128,61,0.4)] md:px-12 md:py-14">
        <div className="animate-soft-float pointer-events-none absolute right-10 top-10 hidden h-28 w-28 rounded-full bg-emerald-100/55 blur-2xl lg:block" />
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
          {home.hero.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
          {home.hero.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-lg">
          {home.hero.description}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {home.hero.primaryAction}
          </LocaleLink>
          <LocaleLink
            href="/apply"
            className="inline-flex rounded-full border border-emerald-300 bg-white/85 px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white"
          >
            {home.hero.secondaryAction}
          </LocaleLink>
          <Link
            href="#contact"
            className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-200"
          >
            {home.hero.contactAction}
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="animate-fade-up rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {home.story.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {home.story.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{home.story.description}</p>
          <div className="mt-6 grid gap-4">
            {Object.entries(home.story.points).map(([key, point]) => (
              <article key={key} className="rounded-2xl bg-emerald-100/80 p-5 text-sm leading-7 text-slate-700 transition hover:-translate-y-0.5 hover:bg-emerald-100">
                {point}
              </article>
            ))}
          </div>
        </section>

        <section className="animate-fade-up rounded-3xl border border-amber-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "140ms" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {home.history.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {home.history.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{home.history.description}</p>
          <div className="mt-6 space-y-4">
            {Object.entries(home.history.milestones).map(([key, milestone]) => (
              <article key={key} className="rounded-2xl border border-amber-200 bg-amber-100/75 p-5 transition hover:-translate-y-0.5 hover:bg-amber-100">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {milestone.year}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{milestone.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{milestone.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="animate-fade-up rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "180ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.offerings.eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {home.offerings.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {home.offerings.description}
            </p>
          </div>
          <LocaleLink
            href="/faqs"
            className="inline-flex rounded-full border border-emerald-300 bg-emerald-100/80 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100"
          >
            {home.contact.actions.faqs}
          </LocaleLink>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {Object.entries(home.offerings.cards).map(([key, card]) => (
            <article key={key} className="rounded-3xl bg-emerald-100/75 p-6 transition hover:-translate-y-1 hover:bg-emerald-100 hover:shadow-md">
              <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-amber-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "220ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.info.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {home.info.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{home.info.description}</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {Object.entries(home.info.cards).map(([key, card]) => (
            <article key={key} className="rounded-3xl border border-amber-200 bg-amber-100/70 p-6 transition hover:-translate-y-1 hover:bg-amber-100 hover:shadow-md">
              <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "260ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.featured.eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {home.featured.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {home.featured.description}
            </p>
          </div>
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {home.featured.browsePrograms}
          </LocaleLink>
        </div>

        {featuredPrograms.length === 0 ? (
          <article className="mt-8 rounded-3xl border border-dashed border-emerald-300 bg-emerald-100/70 p-8">
            <h3 className="text-xl font-semibold text-slate-950">{home.featured.emptyTitle}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {home.featured.emptyDescription}
            </p>
          </article>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {featuredPrograms.map((program) => (
              <article
                key={program.id}
                className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_20px_50px_-45px_rgba(15,23,42,0.55)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-44px_rgba(21,128,61,0.32)]"
              >
                <div
                  className="h-44 bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.14), rgba(15, 23, 42, 0.24)), url(${program.coverImage})` }}
                />
                <div className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${categoryTheme[program.category]}`}
                    >
                      {programsUi.categories[program.category]}
                    </span>
                    <span className="inline-flex rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">
                      {home.featured.featuredLabel}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    {program.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{program.shortDescription}</p>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold text-slate-900">{programsUi.labels.location}</dt>
                      <dd className="mt-1 text-slate-600">{program.location}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">{programsUi.labels.duration}</dt>
                      <dd className="mt-1 text-slate-600">{program.duration}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">{programsUi.labels.availability}</dt>
                      <dd className="mt-1 text-slate-600">{program.availability}</dd>
                    </div>
                  </dl>

                  <LocaleLink
                    href={{ pathname: "/programs/[slug]", params: { slug: program.slug } }}
                    className="mt-6 inline-flex rounded-full border border-emerald-300 bg-emerald-100/80 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100"
                  >
                    {home.featured.viewProgram}
                  </LocaleLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-up rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#f8fbf8_0%,#dff3e7_52%,#f6dfad_100%)] px-8 py-10 text-slate-900 shadow-[0_24px_70px_-48px_rgba(21,128,61,0.28)] md:px-12" style={{ animationDelay: "320ms" }}>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{home.cta.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{home.cta.description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <LocaleLink
            href="/apply"
            className="inline-flex rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {home.cta.primaryAction}
          </LocaleLink>
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-200"
          >
            {home.cta.secondaryAction}
          </LocaleLink>
        </div>
      </section>

      <section id="contact" className="animate-fade-up scroll-mt-24 rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" style={{ animationDelay: "360ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.contact.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {home.contact.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          {home.contact.description}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {Object.entries(home.contact.cards).map(([key, card]) => (
            <article key={key} className="rounded-3xl bg-emerald-100/75 p-6 transition hover:-translate-y-1 hover:bg-emerald-100 hover:shadow-md">
              <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100"
          >
            {home.contact.actions.programs}
          </LocaleLink>
          <LocaleLink
            href="/apply"
            className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {home.contact.actions.apply}
          </LocaleLink>
          <LocaleLink
            href="/faqs"
            className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-5 py-3 text-sm font-semibold text-amber-950 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-200"
          >
            {home.contact.actions.faqs}
          </LocaleLink>
        </div>
      </section>
    </div>
  );
}
