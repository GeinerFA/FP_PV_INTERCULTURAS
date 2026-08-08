import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import {
  PublicApplicationForm,
  type PublicApplicationFormCopy,
} from "@/features/applications/components/public-application-form";
import { getPublicRecaptchaSiteKey } from "@/lib/recaptcha";
import { buildMetadata } from "@/lib/metadata";

import { submitApplicationAction } from "./actions";

type ApplyPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.apply");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { locale } = await params;
  const [pageT, formT] = await Promise.all([
    getTranslations("Pages.apply"),
    getTranslations("ApplicationFlow.form"),
  ]);
  const recaptchaSiteKey = getPublicRecaptchaSiteKey();
  const pageHighlights = [
    pageT("highlightOne"),
    pageT("highlightTwo"),
    pageT("highlightThree"),
  ];
  const formCopy: PublicApplicationFormCopy = {
    introTitle: formT("introTitle"),
    introDescription: formT("introDescription"),
    requiredLegend: formT("requiredLegend"),
    privacyNotice: formT("privacyNotice"),
    captchaLabel: formT("captchaLabel"),
    captchaHelp: formT("captchaHelp"),
    captchaExpired: formT("captchaExpired"),
    captchaError: formT("captchaError"),
    submitLabel: formT("submitLabel"),
    submittingLabel: formT("submittingLabel"),
    phoneDialCodeLabel: formT("phoneDialCodeLabel"),
    searchableSelect: formT.raw("searchableSelect") as PublicApplicationFormCopy["searchableSelect"],
    fields: formT.raw("fields") as PublicApplicationFormCopy["fields"],
    validation: formT.raw("validation") as PublicApplicationFormCopy["validation"],
    errors: formT.raw("errors") as PublicApplicationFormCopy["errors"],
  };

  return (
    <section className="space-y-10 md:space-y-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
        <div className="max-w-3xl pt-2 md:pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
            {pageT("eyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {pageT("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            {pageT("description")}
          </p>
        </div>

        <aside className="rounded-[2rem] border border-white/80 bg-white/72 p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm md:p-7">
          <p className="text-sm font-semibold text-emerald-900 md:text-base">{formCopy.introTitle}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">{formCopy.introDescription}</p>

          <div className="mt-6 space-y-4 border-t border-slate-200/80 pt-6">
            {pageHighlights.map((highlight, index) => (
              <article key={highlight} className="flex gap-3 text-sm leading-7 text-slate-700">
                <span
                  aria-hidden="true"
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${index === 1 ? "bg-amber-400/80" : "bg-emerald-500/70"}`}
                />
                <span>{highlight}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
        <PublicApplicationForm
          action={submitApplicationAction.bind(null, locale)}
          copy={formCopy}
          recaptchaLanguage={locale}
          recaptchaSiteKey={recaptchaSiteKey}
        />

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-[1.75rem] border border-white/80 bg-white/72 p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.2)] backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-950">{formCopy.requiredLegend}</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{formCopy.privacyNotice}</p>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5 shadow-[0_20px_45px_-38px_rgba(5,150,105,0.18)]">
            <p className="text-sm font-semibold text-emerald-950">{formCopy.captchaLabel}</p>
            <p className="mt-3 text-sm leading-7 text-emerald-900/80">{formCopy.captchaHelp}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
