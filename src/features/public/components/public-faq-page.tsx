import Link from "next/link";
import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { Link as LocaleLink } from "@/i18n/navigation";

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
};

export async function PublicFaqPage({ locale }: PublicFaqPageProps) {
  const messages = await getMessages();
  const faqs = messages.Faqs as FaqMessages;
  const entries = Object.values(faqs.entries ?? {}).filter(
    (entry) => entry.question.trim().length > 0 && entry.answer.trim().length > 0,
  );
  const contactHref = `/${locale}#contact`;

  return (
    <div className="space-y-8">
      <section className="animate-fade-up rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_60%,#fef3c7_100%)] p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {faqs.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          {faqs.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{faqs.description}</p>
      </section>

      {entries.length === 0 ? (
        <section className="animate-fade-up rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.3)]" style={{ animationDelay: "80ms" }}>
          <h2 className="text-2xl font-semibold text-slate-950">{faqs.emptyState.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            {faqs.emptyState.description}
          </p>
        </section>
      ) : (
        <section className="grid gap-5">
          {entries.map((entry) => (
            <article key={entry.question} className="animate-fade-up rounded-3xl border border-emerald-100 bg-white/95 p-8 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-54px_rgba(21,128,61,0.28)]">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {entry.question}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{entry.answer}</p>
            </article>
          ))}
        </section>
      )}

      <section className="animate-fade-up rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_58%,#fef3c7_100%)] p-8 text-slate-900 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.35)]" style={{ animationDelay: "120ms" }}>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{faqs.nextSteps.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{faqs.nextSteps.description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            {faqs.actions.programs}
          </LocaleLink>
          <LocaleLink
            href="/apply"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
          >
            {faqs.actions.apply}
          </LocaleLink>
          <Link
            href={contactHref}
            className="inline-flex rounded-full border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm font-semibold text-amber-900 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100"
          >
            {faqs.actions.contact}
          </Link>
        </div>
      </section>
    </div>
  );
}
