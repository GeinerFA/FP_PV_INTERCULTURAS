import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import {
  PublicApplicationForm,
  type PublicApplicationFormCopy,
} from "@/features/applications/components/public-application-form";
import { PublicPageTemplate } from "@/features/public/components/public-page-template";
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
  const t = await getTranslations("ApplicationFlow.form");
  const formCopy: PublicApplicationFormCopy = {
    introTitle: t("introTitle"),
    introDescription: t("introDescription"),
    requiredLegend: t("requiredLegend"),
    privacyNotice: t("privacyNotice"),
    submitLabel: t("submitLabel"),
    submittingLabel: t("submittingLabel"),
    fields: t.raw("fields") as PublicApplicationFormCopy["fields"],
    validation: t.raw("validation") as PublicApplicationFormCopy["validation"],
    errors: t.raw("errors") as PublicApplicationFormCopy["errors"],
  };

  return (
    <PublicPageTemplate pageKey="apply">
      <PublicApplicationForm action={submitApplicationAction.bind(null, locale)} copy={formCopy} />
    </PublicPageTemplate>
  );
}
