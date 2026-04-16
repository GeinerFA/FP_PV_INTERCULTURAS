import { getTranslations } from "next-intl/server";

import { PageCard } from "@/components/common/page-card";

type PublicPageTemplateProps = {
  pageKey:
    | "home"
    | "about"
    | "programs"
    | "programDetail"
    | "apply"
    | "applySuccess"
    | "impact"
    | "contact"
    | "privacy";
  children?: React.ReactNode;
};

export async function PublicPageTemplate({
  pageKey,
  children,
}: PublicPageTemplateProps) {
  const t = await getTranslations(`Pages.${pageKey}`);

  return (
    <PageCard
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      highlights={[t("highlightOne"), t("highlightTwo"), t("highlightThree")]}
    >
      {children}
    </PageCard>
  );
}
