import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";
import { Link } from "@/i18n/navigation";

type SearchParamValue = string | string[] | undefined;

type AdminProgramsPageProps = {
  searchParams: Promise<{ status?: SearchParamValue; view?: SearchParamValue; page?: SearchParamValue }>;
};

export default async function AdminProgramsPage({ searchParams }: AdminProgramsPageProps) {
  const { status, view, page } = await searchParams;
  const feedback = typeof status === "string" ? status : undefined;

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
      <AdminProgramsOverview
        feedback={feedback as Parameters<typeof AdminProgramsOverview>[0]["feedback"]}
        view={view === "archived" ? "archived" : undefined}
        page={normalizePageParam(page)}
      />
    </AdminPageTemplate>
  );
}
