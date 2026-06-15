import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramFormShell } from "@/features/programs/components/admin-program-form-shell";

export default function AdminProgramsNewPage() {
  return (
    <AdminPageTemplate pageKey="programsNew">
      <AdminProgramFormShell mode="create" />
    </AdminPageTemplate>
  );
}
