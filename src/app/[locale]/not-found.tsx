import { getTranslations } from "next-intl/server";

import { PageCard } from "@/components/common/page-card";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <PageCard
      eyebrow="404"
      title={t("title")}
      description={t("description")}
      highlights={[t("description"), t("backHome"), "Pura Vida Interculturas"]}
    >
      <Link
        href="/"
        className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
      >
        {t("backHome")}
      </Link>
    </PageCard>
  );
}
