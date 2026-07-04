import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminDashboardOverview } from "@/features/admin/components/admin-dashboard-overview";

export default function AdminDashboardPage() {
  return (
    <AdminPageTemplate pageKey="dashboard" variant="workspace">
      <AdminDashboardOverview />
    </AdminPageTemplate>
  );
}
