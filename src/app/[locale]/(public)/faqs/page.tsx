import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicFaqPage } from "@/features/public/components/public-faq-page";
import { buildMetadata } from "@/lib/metadata";

type FaqPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ entries?: string }>;
};

export async function generateMetadata({ params }: Pick<FaqPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faqs.metadata" });

  return buildMetadata({ title: t("title"), description: t("description"), locale, href: "/faqs" });
}

export default async function FaqPage({ params, searchParams }: FaqPageProps) {
  const [{ locale }, { entries }] = await Promise.all([params, searchParams]);

  return <PublicFaqPage locale={locale} forceEmptyEntries={entries === "empty"} />;
}
