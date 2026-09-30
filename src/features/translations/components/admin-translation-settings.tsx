import { getTranslations } from "next-intl/server";

import { translatePendingContentAction } from "@/app/[locale]/admin/settings/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { TranslationStatusBadge } from "@/features/translations/components/translation-status-badge";
import { Link } from "@/i18n/navigation";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";
import { isTranslationConfigured } from "@/lib/translation";
import type { TranslationStatus } from "@/lib/translation/types";
import { listProgramCategories } from "@/services/categories/category-service";
import { listAdminFaqEntries } from "@/services/faqs/faq-service";
import { listAdminPrograms } from "@/services/programs/program-service";
import { getProgramTranslationStatus } from "@/services/programs/program-translation-content";
import { getShortTextTranslationStatus } from "@/services/translation/short-text-translation";

export const adminTranslationSettingsFeedbacks = ["translated", "not-configured", "failed"] as const;

export type AdminTranslationSettingsFeedback = (typeof adminTranslationSettingsFeedbacks)[number];

type AdminTranslationSettingsProps = {
  locale: AppLocale;
  session: AdminSession;
  feedback?: AdminTranslationSettingsFeedback;
  translatedCount?: number;
  manualCount?: number;
  errorMessage?: string;
};

const translationStatusOrder: TranslationStatus[] = ["missing", "machine-stale", "manual-stale", "machine", "manual"];

function countStatuses(statuses: TranslationStatus[]): Record<TranslationStatus, number> {
  return Object.fromEntries(
    translationStatusOrder.map((status) => [status, statuses.filter((entry) => entry === status).length]),
  ) as Record<TranslationStatus, number>;
}

export async function AdminTranslationSettings({
  locale,
  session,
  feedback,
  translatedCount = 0,
  manualCount = 0,
  errorMessage,
}: AdminTranslationSettingsProps) {
  const t = await getTranslations("AdminTranslationSettings");
  let programs: Awaited<ReturnType<typeof listAdminPrograms>>;
  let faqs: Awaited<ReturnType<typeof listAdminFaqEntries>>;
  let categories: Awaited<ReturnType<typeof listProgramCategories>>;

  try {
    [programs, faqs, categories] = await Promise.all([listAdminPrograms(), listAdminFaqEntries(), listProgramCategories()]);
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection title={t("unavailable.title")} description={t("unavailable.description")} tone="warning">
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("unavailable.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const isConfigured = isTranslationConfigured();
  const canManage = hasAdminPermission(session, "settings.manage");
  const programStatuses = programs.map((program) => ({
    program,
    status: getProgramTranslationStatus(program.draftSnapshot, "en"),
  }));
  const rows = [
    { key: "programs", counts: countStatuses(programStatuses.map((entry) => entry.status)) },
    {
      key: "faqs",
      counts: countStatuses(
        faqs.map((faq) => getShortTextTranslationStatus({ question: faq.question, answer: faq.answer }, faq.translations.en)),
      ),
    },
    {
      key: "categories",
      counts: countStatuses(
        categories.map((category) => getShortTextTranslationStatus({ name: category.name }, category.translations.en)),
      ),
    },
  ] as const;
  const pendingCount = rows.reduce((total, row) => total + row.counts.missing + row.counts["machine-stale"], 0);
  const programsNeedingReview = programStatuses.filter((entry) => entry.status !== "machine" && entry.status !== "manual");
  const feedbackTone = feedback === "translated" ? "admin-success-banner" : "admin-warning-banner";

  return (
    <div className="space-y-8">
      {feedback ? (
        <div role="status" className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7`}>
          {t(`feedback.${feedback}`, { translated: translatedCount, manual: manualCount, message: errorMessage ?? "" })}
        </div>
      ) : null}

      <AdminWorkspaceSection
        title={isConfigured ? t("provider.configuredTitle") : t("provider.missingTitle")}
        description={isConfigured ? t("provider.configuredDescription") : t("provider.missingDescription")}
        tone={isConfigured ? "default" : "warning"}
      >
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("howItWorks.save")}</li>
            <li>{t("howItWorks.public")}</li>
            <li>{t("howItWorks.manual")}</li>
            <li>{t("howItWorks.shortTexts")}</li>
          </ul>

          {isConfigured && canManage ? (
            <form action={translatePendingContentAction.bind(null, locale)} className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={pendingCount === 0}
                className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("bulk.action")}
              </button>
              <p className="text-sm text-slate-600">
                {pendingCount === 0 ? t("bulk.nothingPending") : t("bulk.pending", { count: pendingCount })}
              </p>
            </form>
          ) : null}
        </div>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection title={t("summary.title")} description={t("summary.description")} contentClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="admin-inner-table-shell min-w-full divide-y divide-emerald-900/8 text-left text-sm text-slate-700">
            <thead className="admin-table-head text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("summary.content")}</th>
                {translationStatusOrder.map((status) => (
                  <th key={status} className="px-6 py-4 font-semibold">
                    <TranslationStatusBadge status={status} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/8">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-6 py-4 font-semibold text-slate-950">{t(`summary.rows.${row.key}`)}</td>
                  {translationStatusOrder.map((status) => (
                    <td key={status} className="px-6 py-4 text-slate-700">
                      {row.counts[status]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminWorkspaceSection>

      {programsNeedingReview.length > 0 ? (
        <AdminWorkspaceSection title={t("review.title")} description={t("review.description")}>
          <ul className="space-y-3">
            {programsNeedingReview.map(({ program, status }) => (
              <li key={program.id} className="admin-inner-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-950">{program.translations.es.title || program.slug}</span>
                  <TranslationStatusBadge status={status} />
                </div>
                <Link
                  href={{ pathname: "/admin/programs/[id]/english", params: { id: program.id } }}
                  className="admin-outline-action inline-flex rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  {t("review.open")}
                </Link>
              </li>
            ))}
          </ul>
        </AdminWorkspaceSection>
      ) : null}
    </div>
  );
}
