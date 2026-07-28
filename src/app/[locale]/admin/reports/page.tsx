import { permanentRedirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { requireAdminSession } from "@/lib/admin-session";

type AdminReportsPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function AdminReportsPage({ params }: AdminReportsPageProps) {
  const { locale } = await params;

  await requireAdminSession({ locale, nextPath: `/${locale}/admin/reports`, permission: "applications.view" });

  permanentRedirect(`/${locale}/admin/applications`);
}
