import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";

type AdminApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { id } = await params;

  return (
    <AdminPageTemplate pageKey="applicationDetail">
      <div className="rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/10 p-5 text-sm leading-6 text-cyan-100">
        Application placeholder ID: <span className="font-semibold">{id}</span>
      </div>
    </AdminPageTemplate>
  );
}
