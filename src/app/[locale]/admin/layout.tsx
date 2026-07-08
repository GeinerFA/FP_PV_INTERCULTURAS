import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminSession } from "@/lib/admin-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return <AdminShell session={session}>{children}</AdminShell>;
}
