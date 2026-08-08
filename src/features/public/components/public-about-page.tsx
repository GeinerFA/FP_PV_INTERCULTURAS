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
    <div lang={locale} className="space-y-16 lg:space-y-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
        <div className="max-w-4xl pt-2 md:pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
            {about.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
            {about.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            {about.description}
          </p>
        </div>

        <aside className="rounded-[2rem] border border-white/80 bg-white/72 p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm md:p-7">
          <div className="space-y-5">
            {[
              about.history.title,
              about.mission.title,
              about.partners.title,
            ].map((title, index) => (
              <article key={title} className="flex gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-medium leading-6 text-slate-700 md:text-base">{title}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-14">
        <div className="max-w-xl lg:pt-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {about.history.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {about.history.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{about.history.description}</p>
        </div>

        <div className="space-y-8">
          {historyMilestones.map(([key, milestone], index) => (
            <article
              key={key}
              className="grid gap-4 border-t border-slate-200/80 pt-8 first:border-t-0 first:pt-0 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-6"
            >
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    index % 2 === 0
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {milestone.year}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">{milestone.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                  {milestone.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(248,251,248,0.72)_0%,rgba(223,243,231,0.48)_52%,rgba(246,223,173,0.28)_100%)] px-6 py-8 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.2)] md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <div className="max-w-xl lg:pt-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
              {about.mission.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {about.mission.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{about.mission.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {missionPillars.map(([key, pillar], index) => (
              <article
                key={key}
                className="rounded-[1.5rem] border border-white/85 bg-white/72 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.22)]"
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    index % 2 === 0
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {index + 1}
                </span>
                <p className="mt-4 text-sm leading-7 text-slate-700">{pillar}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.56)_0%,rgba(223,243,231,0.4)_52%,rgba(246,223,173,0.3)_100%)] px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
              {about.partners.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {about.partners.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{about.partners.description}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {partnerEntries.map(([key, partner], index) => (
            <a
              key={key}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.linkLabel}
              className="group relative flex h-full flex-col rounded-[1.5rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.24)] ring-1 ring-transparent transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_28px_60px_-40px_rgba(15,23,42,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
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
