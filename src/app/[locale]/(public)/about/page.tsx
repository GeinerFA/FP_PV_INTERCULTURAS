import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicAboutPage } from "@/features/public/components/public-about-page";
import { buildMetadata } from "@/lib/metadata";

type AboutPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.about");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  return <PublicAboutPage locale={locale} />;
}
