import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";
import { Link } from "@/i18n/navigation";

type AdminProgramsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminProgramsPage({ searchParams }: AdminProgramsPageProps) {
  const { status } = await searchParams;

  return (
    <AdminPageTemplate
      pageKey="programs"
      variant="workspace"
      useInnerWorkspace
      headerAction={
        <Link
          href="/admin/programs/new"
          className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          Nuevo programa
        </Link>
      }
    >
      <AdminProgramsOverview feedback={status as Parameters<typeof AdminProgramsOverview>[0]["feedback"]} />
    </AdminPageTemplate>
  );
}
