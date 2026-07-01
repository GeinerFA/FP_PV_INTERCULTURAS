import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicPrivacyPage } from "@/features/public/components/public-privacy-page";
import { buildMetadata } from "@/lib/metadata";

type PrivacyPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.privacy");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  return <PublicPrivacyPage locale={locale} />;
}
