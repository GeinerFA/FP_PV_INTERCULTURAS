import Link from "next/link";
import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link as LocaleLink } from "@/i18n/navigation";
import { listPublicFaqEntries } from "@/services/faqs/faq-service";

type FaqMessages = {
  eyebrow: string;
  title: string;
  description: string;
  entries?: Record<
    string,
    {
      question: string;
      answer: string;
    }
  >;
  emptyState: {
    title: string;
    description: string;
  };
  nextSteps: {
    title: string;
    description: string;
  };
  actions: {
    programs: string;
    apply: string;
    contact: string;
  };
};

type PublicFaqPageProps = {
  locale: AppLocale;
  forceEmptyEntries?: boolean;
};

export async function PublicFaqPage({
  locale,
  forceEmptyEntries = false,
}: PublicFaqPageProps) {
  const messages = await getMessages();
  const faqs = messages.Faqs as FaqMessages;
  const persistedEntries = forceEmptyEntries ? [] : await listPublicFaqEntries(locale);
  const entries = forceEmptyEntries
    ? []
    : persistedEntries.filter((entry) => entry.question.trim().length > 0 && entry.answer.trim().length > 0);
  const hasEntries = entries.length > 0;
  const contactHref = `/${locale}#contact`;

  return (
    <div lang={locale} className="space-y-16 lg:space-y-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-end">
        <div className="max-w-4xl pt-2 md:pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
            {faqs.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
            {faqs.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            {faqs.description}
          </p>
        </div>

        <aside className="rounded-[2rem] border border-white/80 bg-white/72 p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm md:p-7">
          {hasEntries ? (
            <nav aria-label={faqs.title} className="space-y-5">
              <ul className="space-y-5">
                {entries.map((entry, index) => (
                  <li key={entry.id}>
                    <a
                      href={`#faq-${entry.id}`}
                      className="flex gap-4 rounded-[1.25rem] border border-transparent px-1 py-1 transition hover:border-emerald-100 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-medium leading-6 text-slate-700 md:text-base">
                        {entry.question}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{faqs.emptyState.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                {faqs.emptyState.description}
              </p>
            </div>
          )}
        </aside>
      </section>

      {!hasEntries ? (
        <section className="rounded-[2rem] border border-slate-200/80 bg-slate-50/75 px-6 py-8 md:px-8 md:py-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {faqs.emptyState.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            {faqs.emptyState.description}
          </p>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {entries.map((entry, index) => (
            <article
              key={entry.id}
              id={`faq-${entry.id}`}
              aria-labelledby={`faq-${entry.id}-question`}
              className="relative rounded-[1.75rem] border border-white/80 bg-white/68 p-6 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.28)] scroll-mt-28"
            >
              <span
                aria-hidden="true"
                className={`absolute left-6 top-0 h-2 w-12 -translate-y-1/2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
              <div className="flex items-start justify-between gap-4">
                <h2 id={`faq-${entry.id}-question`} className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                  {entry.question}
                </h2>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    index % 2 === 0 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">{entry.answer}</p>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.6)_0%,rgba(223,243,231,0.42)_52%,rgba(246,223,173,0.28)_100%)] px-6 py-8 text-slate-900 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {faqs.nextSteps.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{faqs.nextSteps.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <LocaleLink
              href="/programs"
              className="group flex min-h-full flex-col justify-between rounded-[1.5rem] border border-white/80 bg-white/78 p-5 text-left shadow-[0_18px_40px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span className="text-sm font-semibold text-slate-950">{faqs.actions.programs}</span>
              <span className="mt-8 text-sm font-semibold text-emerald-900 transition group-hover:text-emerald-700">
                →
              </span>
            </LocaleLink>
            <LocaleLink
              href="/apply"
              className="group flex min-h-full flex-col justify-between rounded-[1.5rem] border border-white/80 bg-white/78 p-5 text-left shadow-[0_18px_40px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span className="text-sm font-semibold text-slate-950">{faqs.actions.apply}</span>
              <span className="mt-8 text-sm font-semibold text-emerald-900 transition group-hover:text-emerald-700">
                →
              </span>
            </LocaleLink>
            <Link
              href={contactHref}
              className="group flex min-h-full flex-col justify-between rounded-[1.5rem] border border-white/80 bg-white/78 p-5 text-left shadow-[0_18px_40px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:border-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span className="text-sm font-semibold text-slate-950">{faqs.actions.contact}</span>
              <span className="mt-8 text-sm font-semibold text-amber-800 transition group-hover:text-amber-700">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
