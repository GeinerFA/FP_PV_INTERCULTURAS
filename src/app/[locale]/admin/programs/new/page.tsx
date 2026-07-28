import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramFormShell } from "@/features/programs/components/admin-program-form-shell";
import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminProgramsNewPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminProgramsNewPage({ params, searchParams }: AdminProgramsNewPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/programs/new`, permission: "programs.manage" });

  return (
    <AdminPageTemplate pageKey="programsNew" variant="workspace" useInnerWorkspace>
      <AdminProgramFormShell mode="create" feedback={status as Parameters<typeof AdminProgramFormShell>[0]["feedback"]} />
    </AdminPageTemplate>
  );
}
