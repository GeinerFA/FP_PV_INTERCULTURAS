import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";
import { Link } from "@/i18n/navigation";

export default function AdminProgramsPage() {
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
      <AdminProgramsOverview />
    </AdminPageTemplate>
  );
}
