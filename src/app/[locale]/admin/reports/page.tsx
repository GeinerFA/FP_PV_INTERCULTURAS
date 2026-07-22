import { permanentRedirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";

type AdminReportsPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function AdminReportsPage({ params }: AdminReportsPageProps) {
  const { locale } = await params;

  permanentRedirect(`/${locale}/admin/applications`);
}
