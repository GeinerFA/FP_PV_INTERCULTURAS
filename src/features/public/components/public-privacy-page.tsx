import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";

type PublicPrivacyMessages = {
  eyebrow: string;
  title: string;
  description: string;
  intro: {
    eyebrow: string;
    title: string;
    description: string;
  };
  sections: Record<
    string,
    {
      title: string;
      description: string;
    }
  >;
  commitments: {
    eyebrow: string;
    title: string;
    items: Record<string, string>;
  };
};

type PublicPrivacyPageProps = {
  locale: AppLocale;
};

export async function PublicPrivacyPage({ locale }: PublicPrivacyPageProps) {
  const messages = await getMessages();
  const privacy = (messages.Pages as { privacy: PublicPrivacyMessages }).privacy;
  const privacySections = Object.entries(privacy.sections);
  const commitments = Object.entries(privacy.commitments.items);

  return (
    <div lang={locale} className="space-y-14">
      <section className="animate-fade-up grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
            {privacy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {privacy.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{privacy.description}</p>
        </div>

        <article className="border-l border-emerald-200/70 pl-6 text-sm leading-7 text-slate-600">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {privacy.intro.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{privacy.intro.title}</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{privacy.intro.description}</p>
        </article>
      </section>

      <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{privacy.intro.title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{privacy.intro.description}</p>
          </div>

          <div className="space-y-8">
            {privacySections.map(([key, section], index) => (
              <article key={key} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{section.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{section.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="animate-fade-up rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.56)_0%,rgba(223,243,231,0.42)_52%,rgba(246,223,173,0.3)_100%)] px-6 py-8 md:px-8 md:py-10"
        style={{ animationDelay: "140ms" }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {privacy.commitments.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {privacy.commitments.title}
        </h2>

        <div className="mt-8 grid gap-x-10 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          {commitments.map(([key, item], index) => (
            <article key={key} className="relative pl-5 text-sm leading-7 text-slate-700">
              <span
                aria-hidden="true"
                className={`absolute left-0 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
              {item}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
