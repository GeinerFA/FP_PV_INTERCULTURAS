import Image from "next/image";
import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";

const partnerLogoMap = {
  volunteerWorld: {
    src: "/partners/volunteer-world.svg",
    width: 220,
    height: 86,
    wrapperClassName: "bg-emerald-900",
    imageClassName: "h-auto w-full",
  },
  omprakash: {
    src: "/partners/omprakash.png",
    width: 264,
    height: 64,
    wrapperClassName: "bg-white",
    imageClassName: "h-auto w-full",
  },
} as const;

type PublicAboutMessages = {
  eyebrow: string;
  title: string;
  description: string;
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
  mission: {
    eyebrow: string;
    title: string;
    description: string;
    pillars: Record<string, string>;
  };
  partners: {
    eyebrow: string;
    title: string;
    description: string;
    items: Record<
      string,
      {
        logoLabel: string;
        logoAlt: string;
        title: string;
        description: string;
        href: string;
        linkLabel: string;
      }
    >;
  };
};

type PublicAboutPageProps = {
  locale: AppLocale;
};

export async function PublicAboutPage({ locale }: PublicAboutPageProps) {
  const messages = await getMessages();
  const about = (messages.Pages as { about: PublicAboutMessages }).about;
  const historyMilestones = Object.entries(about.history.milestones);
  const missionPillars = Object.entries(about.mission.pillars);
  const partnerEntries = Object.entries(about.partners.items);

  return (
    <div lang={locale} className="space-y-14">
      <section className="animate-fade-up pb-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
          {about.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          {about.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{about.description}</p>
      </section>

      <section
        className="animate-fade-up grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start"
        style={{ animationDelay: "80ms" }}
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
              {about.history.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {about.history.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{about.history.description}</p>
          </div>

          <div className="space-y-4 border-l border-emerald-200/70 pl-5 text-sm leading-7 text-slate-600">
            {historyMilestones.slice(0, 2).map(([key, milestone]) => (
              <article key={key} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.55rem] top-2 h-2 w-2 rounded-full bg-amber-400/80"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {milestone.year}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{milestone.title}</h3>
                <p className="mt-2">{milestone.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6 border-t border-slate-200 pt-2 lg:border-l lg:border-t-0 lg:pl-10">
          {historyMilestones.slice(2).map(([key, milestone]) => (
            <article key={key} className="relative pl-5">
              <span aria-hidden="true" className="absolute left-0 top-2 h-2 w-2 rounded-full bg-amber-400/80" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{milestone.year}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{milestone.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{milestone.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="animate-fade-up grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"
        style={{ animationDelay: "140ms" }}
      >
        <div className="lg:pr-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {about.mission.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {about.mission.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{about.mission.description}</p>
        </div>

        <div className="grid gap-x-10 gap-y-6 border-t border-slate-200 pt-6 md:grid-cols-2 lg:border-t-0 lg:pt-2">
          {missionPillars.map(([key, pillar], index) => (
            <article key={key} className="relative pl-5 text-sm leading-7 text-slate-700">
              <span
                aria-hidden="true"
                className={`absolute left-0 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
              {pillar}
            </article>
          ))}
        </div>
      </section>

      <section
        className="animate-fade-up rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.56)_0%,rgba(223,243,231,0.4)_52%,rgba(246,223,173,0.3)_100%)] px-6 py-8 md:px-8 md:py-10"
        style={{ animationDelay: "200ms" }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {about.partners.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {about.partners.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{about.partners.description}</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {partnerEntries.map(([key, partner], index) => (
            <a
              key={key}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.linkLabel}
              className="group relative flex h-full flex-col rounded-[1.5rem] border border-white/70 bg-white/80 p-6 shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
            >
              {(() => {
                const logo = partnerLogoMap[key as keyof typeof partnerLogoMap];

                return (
                  <div
                    className={`mb-5 flex min-h-24 items-center rounded-[1.25rem] border border-slate-200/80 px-5 py-4 shadow-sm ${logo.wrapperClassName}`}
                  >
                    <Image
                      src={logo.src}
                      alt={partner.logoAlt}
                      width={logo.width}
                      height={logo.height}
                      className={logo.imageClassName}
                    />
                  </div>
                );
              })()}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {partner.logoLabel}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-900 transition group-hover:border-emerald-300 group-hover:bg-emerald-50 ${index % 2 === 0 ? "text-emerald-900" : "text-amber-700"}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M9 7h8v8" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-950">{partner.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{partner.description}</p>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                {partner.linkLabel}
                <span aria-hidden="true">→</span>
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
