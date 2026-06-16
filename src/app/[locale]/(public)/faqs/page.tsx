import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicFaqPage } from "@/features/public/components/public-faq-page";
import { buildMetadata } from "@/lib/metadata";

type FaqPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Faqs.metadata");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = await params;

  return <PublicFaqPage locale={locale} />;
}
