import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import {
  AdminTranslationSettings,
  adminTranslationSettingsFeedbacks,
  type AdminTranslationSettingsFeedback,
} from "@/features/translations/components/admin-translation-settings";
import { Link } from "@/i18n/navigation";
import { requireAdminSession } from "@/lib/admin-session";

type AdminSettingsTranslationsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{
    status?: string;
    translatedCount?: string;
    manualCount?: string;
    translationError?: string;
  }>;
};

function parseCount(value: string | undefined): number {
  const count = Number(value);

  return Number.isInteger(count) && count >= 0 ? count : 0;
}

export default async function AdminSettingsTranslationsPage({ params, searchParams }: AdminSettingsTranslationsPageProps) {
  const [{ locale }, { status, translatedCount, manualCount, translationError }] = await Promise.all([params, searchParams]);
  const session = await requireAdminSession({ locale, nextPath: "/admin/settings/translations", permission: "settings.view" });
  const t = await getTranslations("AdminSettingsOverview");
  const feedback = adminTranslationSettingsFeedbacks.includes(status as AdminTranslationSettingsFeedback)
    ? (status as AdminTranslationSettingsFeedback)
    : undefined;

  return (
    <AdminPageTemplate
      pageKey="settingsTranslations"
      variant="workspace"
      useInnerWorkspace
      headerAction={
        <Link href="/admin/settings" className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
          {t("backAction")}
        </Link>
      }
    >
      <AdminTranslationSettings
        locale={locale}
        session={session}
        feedback={feedback}
        translatedCount={parseCount(translatedCount)}
        manualCount={parseCount(manualCount)}
        errorMessage={translationError?.slice(0, 300)}
      />
    </AdminPageTemplate>
  );
}
