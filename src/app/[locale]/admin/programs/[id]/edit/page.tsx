import { notFound } from "next/navigation";

import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramFormShell } from "@/features/programs/components/admin-program-form-shell";
import { getAdminProgramById } from "@/services/programs/program-service";

type AdminProgramEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProgramEditPage({
  params,
}: AdminProgramEditPageProps) {
  const { id } = await params;
  const program = await getAdminProgramById(id);

  if (!program) {
    notFound();
  }

  return (
    <AdminPageTemplate pageKey="programsEdit" variant="workspace">
      <AdminProgramFormShell mode="edit" program={program} />
    </AdminPageTemplate>
  );
}
