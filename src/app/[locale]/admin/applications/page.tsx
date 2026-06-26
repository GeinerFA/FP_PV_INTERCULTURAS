import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminApplicationsOverview } from "@/features/applications/components/admin-applications-overview";

export default function AdminApplicationsPage() {
  return (
    <AdminPageTemplate pageKey="applications">
      <AdminApplicationsOverview />
    </AdminPageTemplate>
  );
}
