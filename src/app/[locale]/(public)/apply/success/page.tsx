import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { PublicApplicationSuccess } from "@/features/applications/components/public-application-success";
import {
  publicApplicationSuccessCookieName,
  publicApplicationSuccessCookieValue,
} from "@/features/applications/public-application-flow";
import { PublicPageTemplate } from "@/features/public/components/public-page-template";
import { buildMetadata } from "@/lib/metadata";

type ApplySuccessPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.applySuccess");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default async function ApplySuccessPage({ params }: ApplySuccessPageProps) {
  const { locale } = await params;
  const [cookieStore, t] = await Promise.all([
    cookies(),
    getTranslations("ApplicationFlow.success"),
  ]);

  if (cookieStore.get(publicApplicationSuccessCookieName)?.value !== publicApplicationSuccessCookieValue) {
    redirect(`/${locale}/apply`);
  }

  return (
    <PublicPageTemplate pageKey="applySuccess">
      <PublicApplicationSuccess
        badgeLabel={t("badgeLabel")}
        title={t("title")}
        description={t("description")}
        nextStepsTitle={t("nextStepsTitle")}
        nextSteps={t.raw("nextSteps") as string[]}
        primaryActionLabel={t("primaryActionLabel")}
        secondaryActionLabel={t("secondaryActionLabel")}
      />
    </PublicPageTemplate>
  );
}
