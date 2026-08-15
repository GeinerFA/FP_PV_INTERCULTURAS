import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";
import type { AppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { hasAdminPermission, requireAdminSession } from "@/lib/admin-session";

type SearchParamValue = string | string[] | undefined;

type AdminProgramsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: SearchParamValue; view?: SearchParamValue; page?: SearchParamValue }>;
};

export default async function AdminProgramsPage({ params, searchParams }: AdminProgramsPageProps) {
  const [{ locale }, { status, view, page }] = await Promise.all([params, searchParams]);
  const feedback = typeof status === "string" ? status : undefined;
  const session = await requireAdminSession({ locale, nextPath: `/${locale}/admin/programs`, permission: "programs.view" });

  return (
    <AdminPageTemplate
      pageKey="programs"
      variant="workspace"
      useInnerWorkspace
      headerAction={
        hasAdminPermission(session, "programs.manage") ? (
          <Link
            href="/admin/programs/new"
            className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
          >
            Nuevo programa
          </Link>
        ) : null
      }
    >
      <AdminProgramsOverview
        feedback={feedback as Parameters<typeof AdminProgramsOverview>[0]["feedback"]}
        session={session}
        view={view === "archived" ? "archived" : undefined}
        page={normalizePageParam(page)}
      />
    </AdminPageTemplate>
  );
}
