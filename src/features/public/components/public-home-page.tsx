import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link as LocaleLink } from "@/i18n/navigation";
import { listFeaturedPublicPrograms } from "@/services/programs/program-service";

import { PublicHomeVideoCarousel } from "./public-home-video-carousel";

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
  forceEmptyFeatured?: boolean;
};

export async function PublicHomePage({
  locale,
  forceEmptyFeatured = false,
}: PublicHomePageProps) {
  const [messages, featuredPrograms] = await Promise.all([
    getMessages(),
    forceEmptyFeatured ? Promise.resolve([]) : listFeaturedPublicPrograms(locale),
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
  const storyPoints = Object.entries(home.story.points);
  const historyMilestones = Object.entries(home.history.milestones);
  const offeringCards = Object.entries(home.offerings.cards);
  const infoCards = Object.entries(home.info.cards);
  const contactCards = Object.entries(home.contact.cards);

  return (
    <div className="flex flex-col gap-16 lg:gap-20">
      <PublicHomeVideoCarousel
        slides={[
          { src: "/videos/animal.mp4", alt: "Video principal de la experiencia intercultural" },
          { src: "/videos/nature.mp4", alt: "Video del entorno natural de Pérez Zeledón" },
        ]}
      />

      <section className="animate-fade-up -mt-2 md:-mt-6 lg:-mt-10" style={{ animationDelay: "40ms" }}>
        <div className="max-w-4xl border-t border-slate-200/80 pt-8 md:pt-10 lg:pt-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
              {home.hero.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
              {home.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              {home.hero.description}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-14 border-t border-slate-200/80 pt-2 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 lg:pt-4">
        <section className="animate-fade-up pt-4 lg:pt-0" style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {home.story.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {home.story.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{home.story.description}</p>
          <div className="mt-8 grid gap-5 border-t border-slate-200/80 pt-6">
            {storyPoints.map(([key, point], index) => (
              <article key={key} className="flex gap-3 text-sm leading-7 text-slate-700">
                <span
                  aria-hidden="true"
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
                />
                <span>{point}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="animate-fade-up border-t border-slate-200/80 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-4" style={{ animationDelay: "140ms" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {home.history.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {home.history.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{home.history.description}</p>
          <div className="mt-8 space-y-6 border-l border-emerald-200/70 pl-5">
            {historyMilestones.map(([key, milestone]) => (
              <article key={key} className="relative">
                <span aria-hidden="true" className="absolute -left-[1.55rem] top-2 h-2 w-2 rounded-full bg-amber-400/80" />
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

      <section className="animate-fade-up border-t border-slate-200/80 pt-2 md:pt-4" style={{ animationDelay: "180ms" }}>
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

        <div className="mt-8 grid gap-6 border-t border-slate-200/80 pt-6 lg:grid-cols-3">
          {offeringCards.map(([key, card], index) => (
            <article
              key={key}
              className="relative border-l border-slate-200/80 pl-5 lg:min-h-full lg:pr-4"
            >
              <span
                aria-hidden="true"
                className={`absolute -left-1 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
              <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up border-t border-slate-200/80 pt-2 md:pt-4" style={{ animationDelay: "220ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.info.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {home.info.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{home.info.description}</p>

        <div className="mt-8 grid gap-6 border-t border-slate-200/80 pt-6 lg:grid-cols-3">
          {infoCards.map(([key, card], index) => (
            <article key={key} className="relative border-l border-slate-200/80 pl-5 lg:min-h-full lg:pr-4">
              <span
                aria-hidden="true"
                className={`absolute -left-1 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-amber-400/80" : "bg-emerald-500/70"}`}
              />
              <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up border-t border-slate-200/80 pt-2 md:pt-4" style={{ animationDelay: "260ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.featured.eyebrow}
        </p>
        <div className="mt-3 grid gap-6 border-b border-slate-200/80 pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {home.featured.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {home.featured.description}
            </p>
          </div>
          <LocaleLink
            href="/programs"
            className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 lg:self-start"
          >
            {home.featured.browsePrograms}
          </LocaleLink>
        </div>

        {featuredPrograms.length === 0 ? (
          <article className="mt-8 max-w-2xl rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-6 py-6">
            <h3 className="text-xl font-semibold text-slate-950">{home.featured.emptyTitle}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {home.featured.emptyDescription}
            </p>
          </article>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {featuredPrograms.map((program) => (
              <article
                key={program.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-3 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)]"
              >
                <div
                  className="h-44 rounded-[1.75rem] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.14), rgba(15, 23, 42, 0.24)), url(${program.coverImage})` }}
                />
                <div className="px-3 py-5">
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

                  <dl className="mt-6 grid gap-4 border-t border-slate-200/80 pt-5 text-sm sm:grid-cols-3 lg:grid-cols-1">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {programsUi.labels.location}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.location}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {programsUi.labels.duration}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.duration}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {programsUi.labels.availability}
                      </dt>
                      <dd className="mt-2 text-slate-600">{program.availability}</dd>
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

      <section className="animate-fade-up rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.56)_0%,rgba(223,243,231,0.4)_52%,rgba(246,223,173,0.3)_100%)] px-6 py-8 text-slate-900 md:px-8 md:py-10" style={{ animationDelay: "320ms" }}>
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

      <section id="contact" className="animate-fade-up scroll-mt-24 border-t border-slate-200/80 pt-2 md:pt-4" style={{ animationDelay: "360ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {home.contact.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {home.contact.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          {home.contact.description}
        </p>

        <div className="mt-8 grid gap-6 border-t border-slate-200/80 pt-6 lg:grid-cols-3">
          {contactCards.map(([key, card], index) => (
            <article key={key} className="relative border-l border-slate-200/80 pl-5 lg:min-h-full lg:pr-4">
              <span
                aria-hidden="true"
                className={`absolute -left-1 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
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
