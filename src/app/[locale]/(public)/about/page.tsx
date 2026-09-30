import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicAboutPage } from "@/features/public/components/public-about-page";
import { buildMetadata } from "@/lib/metadata";

type AboutPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: Pick<AboutPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.about" });

  return buildMetadata({ title: t("title"), description: t("description"), locale, href: "/about" });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  return <PublicAboutPage locale={locale} />;
}
