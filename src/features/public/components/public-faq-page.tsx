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
    <div className="space-y-12">
      <section className="animate-fade-up pb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
          {faqs.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          {faqs.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{faqs.description}</p>
      </section>

      {entries.length === 0 ? (
        <section className="animate-fade-up pt-2" style={{ animationDelay: "80ms" }}>
          <h2 className="text-2xl font-semibold text-slate-950">{faqs.emptyState.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            {faqs.emptyState.description}
          </p>
        </section>
      ) : (
        <section className="space-y-8">
          {entries.map((entry) => (
            <article key={entry.question} className="animate-fade-up py-1">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {entry.question}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{entry.answer}</p>
            </article>
          ))}
        </section>
      )}

      <section className="animate-fade-up bg-[linear-gradient(135deg,rgba(248,251,248,0.55)_0%,rgba(223,243,231,0.38)_58%,rgba(246,223,173,0.28)_100%)] py-8 text-slate-900" style={{ animationDelay: "120ms" }}>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{faqs.nextSteps.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{faqs.nextSteps.description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <LocaleLink
            href="/programs"
            className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {faqs.actions.programs}
          </LocaleLink>
          <LocaleLink
            href="/apply"
            className="inline-flex rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100"
          >
            {faqs.actions.apply}
          </LocaleLink>
          <Link
            href={contactHref}
            className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-5 py-3 text-sm font-semibold text-amber-950 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-200"
          >
            {faqs.actions.contact}
          </Link>
        </div>
      </section>
    </div>
  );
}
