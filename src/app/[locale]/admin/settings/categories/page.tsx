import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminCategorySettings } from "@/features/categories/components/admin-category-settings";
import { requireAdminSession } from "@/lib/admin-session";
import { Link } from "@/i18n/navigation";

type AdminCategorySettingsFeedback = NonNullable<Parameters<typeof AdminCategorySettings>[0]["feedback"]>;

const adminCategorySettingsFeedbackStatuses = new Set<AdminCategorySettingsFeedback>([
  "created",
  "updated",
  "deleted",
  "invalid",
  "save-failed",
  "delete-failed",
  "delete-blocked",
  "duplicate-code",
]);

function parseAdminCategorySettingsFeedback(status?: string): Parameters<typeof AdminCategorySettings>[0]["feedback"] {
  if (!status || !adminCategorySettingsFeedbackStatuses.has(status as AdminCategorySettingsFeedback)) {
    return undefined;
  }

  return status as AdminCategorySettingsFeedback;
}

type AdminSettingsCategoriesPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ category?: string; focus?: string; status?: string }>;
};

export default async function AdminSettingsCategoriesPage({ params, searchParams }: AdminSettingsCategoriesPageProps) {
  const [{ locale }, { category, focus, status }] = await Promise.all([params, searchParams]);
  const feedback = parseAdminCategorySettingsFeedback(status);
  const t = await getTranslations("AdminSettingsOverview");

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/settings/categories`, permission: "settings.view" });

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
      <AdminCategorySettings feedback={feedback} selectedCategoryId={category} shouldOpenCreateDisclosure={focus === "create"} />
    </AdminPageTemplate>
  );
}
