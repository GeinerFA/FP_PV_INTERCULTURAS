import { getTranslations } from "next-intl/server";

import type { AdminTranslationNotice } from "@/services/translation/admin-translation";

type AdminTranslationNoticeBannerProps = {
  notice: AdminTranslationNotice | null;
};

/** Result of the automatic translation that ran after a save. Failures are warnings, never errors. */
export async function AdminTranslationNoticeBanner({ notice }: AdminTranslationNoticeBannerProps) {
  if (!notice || notice.outcome === "up-to-date") {
    return null;
  }

  const t = await getTranslations("AdminTranslations");
  const tone = notice.outcome === "translated" ? "admin-success-banner" : "admin-warning-banner";

  return (
    <div
      role="status"
      className={`${tone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}
    >
      {t(`notices.${notice.outcome}`, { message: notice.message ?? "" })}
    </div>
  );
}
