import { notFound } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import {
  AdminProgramEnglishForm,
  adminProgramEnglishFeedbacks,
  type AdminProgramEnglishFeedback,
} from "@/features/programs/components/admin-program-english-form";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminProgramById } from "@/services/programs/program-service";
import { parseTranslationNotice } from "@/services/translation/admin-translation";

type AdminProgramEnglishPageProps = {
  params: Promise<{ id: string; locale: AppLocale }>;
  searchParams: Promise<{ status?: string; translation?: string; translationError?: string }>;
};

export default async function AdminProgramEnglishPage({ params, searchParams }: AdminProgramEnglishPageProps) {
  const [{ id, locale }, { status, translation, translationError }] = await Promise.all([params, searchParams]);

  await requireAdminSession({ locale, nextPath: `/admin/programs/${id}/english`, permission: "programs.manage" });

  const program = await getAdminProgramById(id);

  if (!program) {
    notFound();
  }

  const feedback = adminProgramEnglishFeedbacks.includes(status as AdminProgramEnglishFeedback)
    ? (status as AdminProgramEnglishFeedback)
    : undefined;

  return (
    <AdminPageTemplate pageKey="programsEnglish" variant="workspace" useInnerWorkspace>
      <AdminProgramEnglishForm
        locale={locale}
        program={program}
        feedback={feedback}
        translationNotice={parseTranslationNotice(translation, translationError)}
      />
    </AdminPageTemplate>
  );
}
