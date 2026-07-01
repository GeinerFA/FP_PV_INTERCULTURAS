import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicImpactPage } from "@/features/public/components/public-impact-page";
import { buildMetadata } from "@/lib/metadata";

type ImpactPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.impact");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function ImpactPage({ params }: ImpactPageProps) {
  const { locale } = await params;

  return <PublicImpactPage locale={locale} />;
}
