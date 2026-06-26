import { notFound } from "next/navigation";

import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminApplicationDetail } from "@/features/applications/components/admin-application-detail";
import type { AppLocale } from "@/config/i18n";
import { getApplicationById } from "@/services/applications/application-service";

import { updateApplicationStatusAction } from "./actions";

type AdminApplicationDetailPageProps = {
  params: Promise<{ id: string; locale: AppLocale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminApplicationDetailPage({
  params,
  searchParams,
}: AdminApplicationDetailPageProps) {
  const [{ id, locale }, { status }] = await Promise.all([params, searchParams]);
  const application = await getApplicationById(id);

  if (!application) {
    notFound();
  }

  const feedback =
    status === "updated" ||
    status === "invalid" ||
    status === "no-change" ||
    status === "failed"
      ? status
      : undefined;

  return (
    <AdminPageTemplate pageKey="applicationDetail">
      <AdminApplicationDetail
        application={application}
        updateAction={updateApplicationStatusAction.bind(null, locale, id)}
        feedback={feedback}
      />
    </AdminPageTemplate>
  );
}
