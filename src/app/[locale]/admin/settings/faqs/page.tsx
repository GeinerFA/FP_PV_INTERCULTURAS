import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminFaqSettings } from "@/features/faqs/components/admin-faq-settings";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

type AdminSettingsFeedback = NonNullable<Parameters<typeof AdminFaqSettings>[0]["feedback"]>;

const adminSettingsFeedbackStatuses = new Set<AdminSettingsFeedback>([
  "created",
  "updated",
  "deleted",
  "reordered",
  "invalid",
  "save-failed",
  "delete-failed",
  "reorder-failed",
]);

function parseAdminSettingsFeedback(status?: string): Parameters<typeof AdminFaqSettings>[0]["feedback"] {
  if (!status || !adminSettingsFeedbackStatuses.has(status as AdminSettingsFeedback)) {
    return undefined;
  }

  return status as AdminSettingsFeedback;
}

type AdminSettingsFaqPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminSettingsFaqPage({ params, searchParams }: AdminSettingsFaqPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const feedback = parseAdminSettingsFeedback(status);
  const t = await getTranslations("AdminSettingsOverview");

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/settings/faqs`, permission: "settings.view" });

  return (
    <AdminPageTemplate
      pageKey="settings"
      variant="workspace"
      useInnerWorkspace
      sections={[]}
      headerAction={
        <Link
          href="/admin/settings"
          className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          {t("backAction")}
        </Link>
      }
    >
      <AdminFaqSettings feedback={feedback} />
    </AdminPageTemplate>
  );
}
