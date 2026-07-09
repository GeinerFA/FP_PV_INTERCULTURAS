import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramFormShell } from "@/features/programs/components/admin-program-form-shell";
import type { AppLocale } from "@/config/i18n";

type AdminProgramsNewPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminProgramsNewPage({ searchParams }: AdminProgramsNewPageProps) {
  const { status } = await searchParams;

  return (
    <AdminPageTemplate pageKey="programsNew" variant="workspace">
      <AdminProgramFormShell mode="create" feedback={status as Parameters<typeof AdminProgramFormShell>[0]["feedback"]} />
    </AdminPageTemplate>
  );
}
