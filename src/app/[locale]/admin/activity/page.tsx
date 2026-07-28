import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminActivityOverview } from "@/features/admin/components/admin-activity-overview";
import { normalizePageParam } from "@/features/admin/lib/pagination";

type SearchParamValue = string | string[] | undefined;

type AdminActivityPageProps = {
  searchParams: Promise<{ page?: SearchParamValue }>;
};

export default async function AdminActivityPage({ searchParams }: AdminActivityPageProps) {
  const { page } = await searchParams;

  return (
    <AdminPageTemplate pageKey="activity" variant="workspace" useInnerWorkspace>
      <AdminActivityOverview page={normalizePageParam(page)} />
    </AdminPageTemplate>
  );
}
