import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link as LocaleLink } from "@/i18n/navigation";
import { listPublicHomeHeroVideos } from "@/services/home-hero-videos/home-hero-video-service";
import { listFeaturedPublicPrograms } from "@/services/programs/program-service";

import { PublicFeaturedProgramsCarousel } from "./public-featured-programs-carousel";
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
    previousPrograms: string;
    nextPrograms: string;
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
      instagramLabel: string;
      whatsappLabel: string;
    };
  };
};

type PublicHomePageProps = {
  locale: AppLocale;
  forceEmptyFeatured?: boolean;
};

export async function PublicHomePage({
  locale,
  forceEmptyFeatured = false,
}: PublicHomePageProps) {
  const instagramHref =
    "https://www.instagram.com/voluntariado_pvi?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
  const whatsappHref =
    "https://wa.me/50689511665?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Pura%20Vida%20Interculturas.%20Muchas%20gracias.";
  const [messages, featuredPrograms, heroVideos] = await Promise.all([
    getMessages(),
    forceEmptyFeatured ? Promise.resolve([]) : listFeaturedPublicPrograms(locale),
    listPublicHomeHeroVideos(),
  ]);

  const home = messages.Home as HomeMessages;
  const programsUi = messages.ProgramsUi as {
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
  const featuredHeadingId = "featured-programs-heading";

  return (
    <div className="flex flex-col gap-16 lg:gap-20">
      <PublicHomeVideoCarousel
        slides={heroVideos.map((video) => ({
          id: video.id,
          src: video.sourceUrl,
          fileName: video.fileName,
          mediaType: video.mediaType,
          displayDurationSeconds: video.displayDurationSeconds,
        }))}
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
            <h2 id={featuredHeadingId} className="text-3xl font-semibold tracking-tight text-slate-950">
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
          <PublicFeaturedProgramsCarousel
            featuredPrograms={featuredPrograms}
            featuredHeadingId={featuredHeadingId}
            labels={{
              featured: home.featured.featuredLabel,
              viewProgram: home.featured.viewProgram,
              previousPrograms: home.featured.previousPrograms,
              nextPrograms: home.featured.nextPrograms,
              location: programsUi.labels.location,
              duration: programsUi.labels.duration,
              availability: programsUi.labels.availability,
            }}
          />
        )}
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

        <div className="mt-8">
          <div className="flex flex-wrap gap-4">
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
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={home.contact.actions.instagramLabel}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
                <defs>
                  <linearGradient id="instagram-contact-logo" x1="20.12" x2="3.88" y1="3.88" y2="20.12" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#F58529" />
                    <stop offset="0.3" stopColor="#FEDA77" />
                    <stop offset="0.55" stopColor="#DD2A7B" />
                    <stop offset="0.78" stopColor="#8134AF" />
                    <stop offset="1" stopColor="#515BD4" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#instagram-contact-logo)" />
                <circle cx="12" cy="12" r="4.1" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                <rect x="7.4" y="7.4" width="9.2" height="9.2" rx="2.8" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.9" r="1.05" fill="#FFFFFF" />
              </svg>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={home.contact.actions.whatsappLabel}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  fill="#25D366"
                  d="M12 2.75A9.24 9.24 0 0 0 4.1 16.8L2.75 21.25l4.56-1.31A9.25 9.25 0 1 0 12 2.75Z"
                />
                <path
                  fill="#FFFFFF"
                  d="M17.12 14.18c-.28-.14-1.67-.82-1.93-.91-.26-.09-.45-.14-.64.14-.18.28-.73.91-.89 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.24-1.37-.82-.73-1.38-1.63-1.54-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.18-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.35s1 2.73 1.14 2.92c.14.19 1.95 2.97 4.72 4.17.66.28 1.17.45 1.57.58.66.21 1.25.18 1.72.11.52-.08 1.67-.68 1.91-1.34.23-.65.23-1.21.16-1.34-.07-.12-.26-.19-.54-.33Z"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
