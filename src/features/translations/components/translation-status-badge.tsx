import { getTranslations } from "next-intl/server";

import type { TranslationStatus } from "@/lib/translation/types";

const translationStatusTheme: Record<TranslationStatus, string> = {
  missing: "bg-slate-100 text-slate-700 ring-slate-200",
  machine: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "machine-stale": "bg-amber-50 text-amber-700 ring-amber-200",
  manual: "bg-sky-50 text-sky-700 ring-sky-200",
  "manual-stale": "bg-rose-50 text-rose-700 ring-rose-200",
};

type TranslationStatusBadgeProps = {
  status: TranslationStatus;
  /** Prefix the badge with the target language ("Inglés · Traducida"). */
  withLanguage?: boolean;
};

export async function TranslationStatusBadge({ status, withLanguage = false }: TranslationStatusBadgeProps) {
  const t = await getTranslations("AdminTranslations");
  const label = t(`statuses.${status}`);

  return (
    <span
      title={t(`statusDescriptions.${status}`)}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${translationStatusTheme[status]}`}
    >
      {withLanguage ? `${t("englishLabel")} · ${label}` : label}
    </span>
  );
}
