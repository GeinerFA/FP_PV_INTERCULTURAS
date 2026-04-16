import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { PublicProgramDetail } from "@/features/programs/components/public-program-detail";
import { PublicPageTemplate } from "@/features/public/components/public-page-template";
import { buildMetadata } from "@/lib/metadata";
import { getPublicProgramBySlug } from "@/services/programs/program-service";

type ProgramDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export async function generateMetadata({
  params,
}: ProgramDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [program, t] = await Promise.all([
    getPublicProgramBySlug(slug, locale),
    getTranslations("Pages.programDetail"),
  ]);

  if (!program) {
    return buildMetadata({ title: t("title"), description: t("description") });
  }

  return buildMetadata({
    title: program.seoTitle,
    description: program.seoDescription,
  });
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { locale, slug } = await params;

  const program = await getPublicProgramBySlug(slug, locale);

  if (!program) {
    notFound();
  }

  return (
    <PublicPageTemplate pageKey="programDetail">
      <PublicProgramDetail program={program} />
    </PublicPageTemplate>
  );
}
