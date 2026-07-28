import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import { normalizeAdminApplicationListFilters } from "@/features/applications/admin-application-list-filters";
import { AdminApplicationsOverview } from "@/features/applications/components/admin-applications-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type SearchParamValue = string | string[] | undefined;

type AdminApplicationsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{
    status?: SearchParamValue;
    type?: SearchParamValue;
    q?: SearchParamValue;
    from?: SearchParamValue;
    to?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

function buildSearchParamString(searchParams: Record<string, SearchParamValue>): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(searchParams)) {
    const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];

    for (const value of values) {
      params.append(key, value);
    }
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export default async function AdminApplicationsPage({ params, searchParams }: AdminApplicationsPageProps) {
  const [{ locale }, rawSearchParams] = await Promise.all([params, searchParams]);
  const filters = normalizeAdminApplicationListFilters(rawSearchParams);
  const page = normalizePageParam(rawSearchParams.page);

  await requireAdminSession({
    locale,
    nextPath: `/${locale}/admin/applications${buildSearchParamString(rawSearchParams)}`,
    permission: "applications.view",
  });

  return (
    <AdminPageTemplate pageKey="applications" variant="workspace" useInnerWorkspace>
      <AdminApplicationsOverview filters={filters} page={page} />
    </AdminPageTemplate>
  );
}
