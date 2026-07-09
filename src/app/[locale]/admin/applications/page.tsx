import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminApplicationsOverview } from "@/features/applications/components/admin-applications-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminApplicationsPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function AdminApplicationsPage({ params }: AdminApplicationsPageProps) {
  const { locale } = await params;

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/applications` });

  return (
    <AdminPageTemplate pageKey="applications" variant="workspace">
      <AdminApplicationsOverview />
    </AdminPageTemplate>
  );
}
