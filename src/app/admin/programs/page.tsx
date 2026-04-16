import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminProgramsOverview } from "@/features/programs/components/admin-programs-overview";

export default function AdminProgramsPage() {
  return (
    <AdminPageTemplate pageKey="programs">
      <AdminProgramsOverview />
    </AdminPageTemplate>
  );
}
