import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicHomePage } from "@/features/public/components/public-home-page";
import { buildMetadata } from "@/lib/metadata";

type LocaleHomePageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ featured?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home.metadata");

  return buildMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function LocaleHomePage({ params, searchParams }: LocaleHomePageProps) {
  const [{ locale }, { featured }] = await Promise.all([params, searchParams]);

  return <PublicHomePage locale={locale} forceEmptyFeatured={featured === "empty"} />;
}
