import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminActivityOverview } from "@/features/admin/components/admin-activity-overview";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type SearchParamValue = string | string[] | undefined;

type AdminActivityPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ page?: SearchParamValue }>;
};

export default async function AdminActivityPage({ params, searchParams }: AdminActivityPageProps) {
  const [{ locale }, { page }] = await Promise.all([params, searchParams]);

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/activity`, permission: "activity.view" });

  return (
    <AdminPageTemplate pageKey="activity" variant="workspace" useInnerWorkspace>
      <AdminActivityOverview page={normalizePageParam(page)} />
    </AdminPageTemplate>
  );
}
