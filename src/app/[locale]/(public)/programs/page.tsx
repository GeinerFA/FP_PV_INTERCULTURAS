import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { PublicProgramsCatalog } from "@/features/programs/components/public-programs-catalog";
import { PublicPageTemplate } from "@/features/public/components/public-page-template";
import { buildMetadata } from "@/lib/metadata";

type ProgramsPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: Pick<ProgramsPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.programs" });

  return buildMetadata({ title: t("title"), description: t("description"), locale, href: "/programs" });
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { locale } = await params;

  return (
    <PublicPageTemplate pageKey="programs">
      <PublicProgramsCatalog locale={locale} />
    </PublicPageTemplate>
  );
}
