import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { defaultLocale, locales, type AppLocale } from "@/config/i18n";
import { PublicProgramDetail } from "@/features/programs/components/public-program-detail";
import { PublicPageTemplate } from "@/features/public/components/public-page-template";
import { getPathname } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/metadata";
import { getPublicProgramBySlug } from "@/services/programs/program-service";

type ProgramDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

async function listProgramLocales(slug: string): Promise<AppLocale[]> {
  const programs = await Promise.all(locales.map((locale) => getPublicProgramBySlug(slug, locale)));

  return locales.filter((_, index) => programs[index] !== null);
}

export async function generateMetadata({
  params,
}: ProgramDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [program, t] = await Promise.all([
    getPublicProgramBySlug(slug, locale),
    getTranslations({ locale, namespace: "Pages.programDetail" }),
  ]);

  if (!program) {
    return buildMetadata({ title: t("title"), description: t("description") });
  }

  return buildMetadata({
    title: program.seoTitle,
    description: program.seoDescription,
    locale,
    href: { pathname: "/programs/[slug]", params: { slug } },
    availableLocales: await listProgramLocales(slug),
    image: program.coverImage,
  });
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { locale, slug } = await params;

  const program = await getPublicProgramBySlug(slug, locale);

  if (!program) {
    // Not translated yet: send visitors to the source-language page instead of a 404.
    if (locale !== defaultLocale && (await getPublicProgramBySlug(slug, defaultLocale))) {
      redirect(getPathname({ href: { pathname: "/programs/[slug]", params: { slug } }, locale: defaultLocale }));
    }

    notFound();
  }

  return (
    <PublicPageTemplate pageKey="programDetail">
      <PublicProgramDetail program={program} />
    </PublicPageTemplate>
  );
}
