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
          className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          Nuevo programa
        </Link>
      }
    >
      <AdminProgramsOverview />
    </AdminPageTemplate>
  );
}
