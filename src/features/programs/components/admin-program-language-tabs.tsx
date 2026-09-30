import { getTranslations } from "next-intl/server";

import { TranslationStatusBadge } from "@/features/translations/components/translation-status-badge";
import { Link } from "@/i18n/navigation";
import type { TranslationStatus } from "@/lib/translation/types";

type AdminProgramLanguageTabsProps = {
  programId: string;
  active: "source" | "english";
  englishStatus: TranslationStatus;
};

/** One tab per language in the program editor: the Spanish source form and the English translation. */
export async function AdminProgramLanguageTabs({ programId, active, englishStatus }: AdminProgramLanguageTabsProps) {
  const t = await getTranslations("AdminProgramEnglish");
  const tabClassName = "inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold transition";

  return (
    <nav aria-label={t("tabs.label")} className="flex flex-wrap items-center gap-2">
      <Link
        href={{ pathname: "/admin/programs/[id]/edit", params: { id: programId } }}
        aria-current={active === "source" ? "page" : undefined}
        className={`${tabClassName} ${active === "source" ? "admin-primary-action" : "admin-outline-action"}`}
      >
        {t("tabs.source")}
      </Link>
      <Link
        href={{ pathname: "/admin/programs/[id]/english", params: { id: programId } }}
        aria-current={active === "english" ? "page" : undefined}
        className={`${tabClassName} ${active === "english" ? "admin-primary-action" : "admin-outline-action"}`}
      >
        {t("tabs.english")}
        <TranslationStatusBadge status={englishStatus} />
      </Link>
    </nav>
  );
}
