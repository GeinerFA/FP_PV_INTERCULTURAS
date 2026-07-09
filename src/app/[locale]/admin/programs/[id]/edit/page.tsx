import { notFound } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramFormShell } from "@/features/programs/components/admin-program-form-shell";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminProgramById } from "@/services/programs/program-service";

type AdminProgramEditPageProps = {
  params: Promise<{ id: string; locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminProgramEditPage({
  params,
  searchParams,
}: AdminProgramEditPageProps) {
  const [{ id, locale }, { status }] = await Promise.all([params, searchParams]);

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/programs/${id}/edit` });

  const program = await getAdminProgramById(id);

  if (!program) {
    notFound();
  }

  return (
    <AdminPageTemplate pageKey="programsEdit" variant="workspace">
      <AdminProgramFormShell
        mode="edit"
        program={program}
        feedback={status as Parameters<typeof AdminProgramFormShell>[0]["feedback"]}
      />
    </AdminPageTemplate>
  );
}
