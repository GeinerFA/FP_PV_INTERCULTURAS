import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminSettingsOverview } from "@/features/admin/components/admin-settings-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminSettingsPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function AdminSettingsPage({ params }: AdminSettingsPageProps) {
  const { locale } = await params;

  const session = await requireAdminSession({
    locale,
    nextPath: `/${locale}/admin/settings`,
    permission: ["settings.view", "users.view"],
  });

  return (
    <AdminPageTemplate pageKey="settings" variant="workspace" useInnerWorkspace>
      <AdminSettingsOverview session={session} />
    </AdminPageTemplate>
  );
}
