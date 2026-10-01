import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { normalizePageParam } from "@/features/admin/lib/pagination";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";
import { parseTranslationNotice } from "@/services/translation/admin-translation";

type SearchParamValue = string | string[] | undefined;

type AdminProgramsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{
    status?: SearchParamValue;
    view?: SearchParamValue;
    page?: SearchParamValue;
    translation?: SearchParamValue;
    translationError?: SearchParamValue;
  }>;
};

export default async function AdminProgramsPage({ params, searchParams }: AdminProgramsPageProps) {
  const [{ locale }, { status, view, page, translation, translationError }] = await Promise.all([params, searchParams]);
  const feedback = typeof status === "string" ? status : undefined;
  const session = await requireAdminSession({ locale, nextPath: "/admin/programs", permission: "programs.view" });

  return (
    <AdminPageTemplate
      pageKey="programs"
      variant="workspace"
      useInnerWorkspace
    >
      <AdminProgramsOverview
        feedback={feedback as Parameters<typeof AdminProgramsOverview>[0]["feedback"]}
        session={session}
        view={view === "archived" ? "archived" : undefined}
        page={normalizePageParam(page)}
        translationNotice={parseTranslationNotice(translation, translationError)}
      />
    </AdminPageTemplate>
  );
}
