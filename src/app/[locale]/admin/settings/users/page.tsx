import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminUserSettings } from "@/features/admin/components/admin-user-settings";
import { Link } from "@/i18n/navigation";
import { requireAdminSession } from "@/lib/admin-session";

type AdminUserSettingsFeedback = NonNullable<Parameters<typeof AdminUserSettings>[0]["feedback"]>;

const adminUserSettingsFeedbackStatuses = new Set<AdminUserSettingsFeedback>([
  "created",
  "updated",
  "activated",
  "deactivated",
  "invalid",
  "save-failed",
  "toggle-failed",
  "duplicate-email",
  "last-superadmin-protected",
]);

function parseAdminUserSettingsFeedback(status?: string): Parameters<typeof AdminUserSettings>[0]["feedback"] {
  if (!status || !adminUserSettingsFeedbackStatuses.has(status as AdminUserSettingsFeedback)) {
    return undefined;
  }

  return status as AdminUserSettingsFeedback;
}

type AdminSettingsUsersPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminSettingsUsersPage({ params, searchParams }: AdminSettingsUsersPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const feedback = parseAdminUserSettingsFeedback(status);
  const t = await getTranslations("AdminSettingsOverview");
  const session = await requireAdminSession({ locale, nextPath: `/${locale}/admin/settings/users`, permission: "users.view" });

  return (
    <AdminPageTemplate
      pageKey="settingsUsers"
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
      <AdminUserSettings feedback={feedback} session={session} />
    </AdminPageTemplate>
  );
}
