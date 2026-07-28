import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminDashboardOverview } from "@/features/admin/components/admin-dashboard-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminDashboardPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { locale } = await params;

  await requireAdminSession({ locale, nextPath: `/${locale}/admin`, permission: "dashboard.view" });

  return (
    <AdminPageTemplate pageKey="dashboard" variant="workspace">
      <AdminDashboardOverview />
    </AdminPageTemplate>
  );
}
