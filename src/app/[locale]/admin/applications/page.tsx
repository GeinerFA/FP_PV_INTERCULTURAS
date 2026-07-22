import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { normalizeAdminApplicationListFilters } from "@/features/applications/admin-application-list-filters";
import { AdminApplicationsOverview } from "@/features/applications/components/admin-applications-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminApplicationsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{
    status?: string;
    type?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminApplicationsPage({ params, searchParams }: AdminApplicationsPageProps) {
  const [{ locale }, rawSearchParams] = await Promise.all([params, searchParams]);
  const filters = normalizeAdminApplicationListFilters(rawSearchParams);

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/applications` });

  return (
    <AdminPageTemplate pageKey="applications" variant="workspace" useInnerWorkspace>
      <AdminApplicationsOverview filters={filters} />
    </AdminPageTemplate>
  );
}
