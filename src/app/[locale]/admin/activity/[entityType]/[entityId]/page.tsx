import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminActivityHistoryView } from "@/features/admin/components/admin-activity-history-view";
import type { AppLocale } from "@/config/i18n";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import { requireAdminSession } from "@/lib/admin-session";

type SearchParamValue = string | string[] | undefined;

type AdminActivityHistoryPageProps = {
  params: Promise<{ entityId: string; entityType: string; locale: AppLocale }>;
  searchParams: Promise<{ page?: SearchParamValue }>;
};

export default async function AdminActivityHistoryPage({ params, searchParams }: AdminActivityHistoryPageProps) {
  const [{ entityId, entityType, locale }, { page }] = await Promise.all([params, searchParams]);
  const normalizedPage = normalizePageParam(page);
  const pageSuffix = normalizedPage > 1 ? `?page=${normalizedPage}` : "";

  await requireAdminSession({
    locale,
    nextPath: `/${locale}/admin/activity/${entityType}/${entityId}${pageSuffix}`,
    permission: "activity.view",
  });

  return (
    <AdminPageTemplate pageKey="activity" variant="workspace" useInnerWorkspace>
      <AdminActivityHistoryView entityType={entityType} entityId={entityId} page={normalizedPage} />
    </AdminPageTemplate>
  );
}
