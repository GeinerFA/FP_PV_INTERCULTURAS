import { getTranslations } from "next-intl/server";

import { retranslateProgramAction, saveProgramEnglishAction } from "@/app/[locale]/admin/programs/actions";
import { sourceLocale, type AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { AdminProgramLanguageTabs } from "@/features/programs/components/admin-program-language-tabs";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { AdminTranslationNoticeBanner } from "@/features/translations/components/admin-translation-notice-banner";
import { isTranslationConfigured } from "@/lib/translation";
import {
  extractProgramTranslatableContent,
  getProgramTranslationMeta,
  getProgramTranslationStatus,
  hashProgramSourceContent,
} from "@/services/programs/program-translation-content";
import type { AdminTranslationNotice } from "@/services/translation/admin-translation";
import type { Program, ProgramTranslatableContent } from "@/types/program";

export const adminProgramEnglishFeedbacks = ["saved", "invalid", "save-failed", "retranslated"] as const;

export type AdminProgramEnglishFeedback = (typeof adminProgramEnglishFeedbacks)[number];

type AdminProgramEnglishFormProps = {
  locale: AppLocale;
  program: Program;
  feedback?: AdminProgramEnglishFeedback;
  translationNotice: AdminTranslationNotice | null;
};

type FieldDefinition = {
  key: keyof ProgramTranslatableContent;
  kind: "input" | "textarea" | "lines";
  rows?: number;
};

const englishFields: FieldDefinition[] = [
  { key: "title", kind: "input" },
  { key: "shortDescription", kind: "textarea", rows: 3 },
  { key: "fullDescription", kind: "textarea", rows: 7 },
  { key: "location", kind: "input" },
  { key: "duration", kind: "input" },
  { key: "availability", kind: "input" },
  { key: "requirements", kind: "lines", rows: 6 },
  { key: "included", kind: "lines", rows: 6 },
  { key: "seoTitle", kind: "input" },
  { key: "seoDescription", kind: "textarea", rows: 3 },
];

function toFieldValue(content: ProgramTranslatableContent, key: FieldDefinition["key"]): string {
  const value = content[key];

  return Array.isArray(value) ? value.join("\n") : value;
}

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export async function AdminProgramEnglishForm({ locale, program, feedback, translationNotice }: AdminProgramEnglishFormProps) {
  const t = await getTranslations("AdminProgramEnglish");
  const status = getProgramTranslationStatus(program.draftSnapshot, "en");
  const meta = getProgramTranslationMeta(program.draftSnapshot, "en");
  const source = extractProgramTranslatableContent(program.draftSnapshot, sourceLocale);
  const english = extractProgramTranslatableContent(program.draftSnapshot, "en");
  const isConfigured = isTranslationConfigured();
  const hasUnpublishedSourceChanges =
    program.publishedSnapshot !== null &&
    hashProgramSourceContent(program.publishedSnapshot) !== hashProgramSourceContent(program.draftSnapshot);
  const retranslateAction = retranslateProgramAction.bind(null, locale, program.id);
  const retranslateLabel = status === "missing" ? t("actions.translateNow") : t("actions.retranslate");
  const formId = `admin-program-english-${program.id}`;
  const retranslateFormId = `admin-program-retranslate-${program.id}`;
  const fieldInputClassName = "admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition";
  const textareaClassName = "admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition";
  const feedbackTone = feedback === "invalid" || feedback === "save-failed" ? "admin-warning-banner" : "admin-success-banner";

  return (
    <div className="space-y-8">
      <AdminProgramLanguageTabs programId={program.id} active="english" englishStatus={status} />

      {feedback && feedback !== "retranslated" ? (
        <div className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7`}>
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}
      <AdminTranslationNoticeBanner notice={translationNotice} />

      <AdminWorkspaceSection
        title={t("status.title", { status: t(`statuses.${status}`) })}
        description={t(`statusDescriptions.${status}`)}
        tone={status === "manual-stale" ? "warning" : "default"}
      >
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            {meta?.translatedAt
              ? t("status.lastMachineTranslation", { date: formatDateTime(meta.translatedAt, locale) })
              : t("status.neverMachineTranslated")}
          </p>
          {hasUnpublishedSourceChanges ? (
            <p className="admin-inner-panel-subtle rounded-2xl px-4 py-3">{t("status.unpublishedSource")}</p>
          ) : null}
          {!isConfigured ? (
            <p className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-amber-900">
              {t("status.notConfigured")}
            </p>
          ) : null}

          {isConfigured ? (
            <form id={retranslateFormId} action={retranslateAction}>
              {status === "manual" || status === "manual-stale" ? (
                <DestructiveActionConfirmation
                  title={t("retranslateConfirmation.title")}
                  description={t("retranslateConfirmation.description")}
                  warning={t("retranslateConfirmation.warning")}
                  triggerLabel={retranslateLabel}
                  confirmLabel={t("retranslateConfirmation.confirm")}
                  cancelLabel={t("retranslateConfirmation.cancel")}
                  confirmValue="retranslate"
                  formId={retranslateFormId}
                  formAction={retranslateAction}
                  tone="warning"
                  actionLayout="stacked"
                  className="w-full md:max-w-sm"
                />
              ) : (
                <button type="submit" className="admin-secondary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
                  {retranslateLabel}
                </button>
              )}
            </form>
          ) : null}
        </div>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection title={t("form.title")} description={t("form.description")}>
        {/* Remount after a retranslation so the uncontrolled fields pick up the new text. */}
        <form
          key={meta?.translatedAt ?? "untranslated"}
          id={formId}
          action={saveProgramEnglishAction.bind(null, locale, program.id)}
          className="space-y-6"
        >
          {englishFields.map((field) => {
            const sourceValue = toFieldValue(source, field.key);
            const inputName = field.key;

            return (
              <div key={field.key} className="admin-inner-panel grid gap-4 rounded-[24px] p-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t(`fields.${field.key}`)} · {t("sourceLabel")}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{sourceValue || "—"}</p>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    {t(`fields.${field.key}`)} · {t("englishLabel")}
                  </span>
                  {field.kind === "input" ? (
                    <input name={inputName} defaultValue={toFieldValue(english, field.key)} className={fieldInputClassName} />
                  ) : (
                    <textarea
                      name={inputName}
                      defaultValue={toFieldValue(english, field.key)}
                      rows={field.rows}
                      className={textareaClassName}
                    />
                  )}
                  {field.kind === "lines" ? <span className="block text-xs text-slate-500">{t("linesHelp")}</span> : null}
                </label>
              </div>
            );
          })}

          <div className="flex flex-col gap-3 border-t border-emerald-900/8 pt-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-slate-600">{t("form.saveHint")}</p>
            <button type="submit" className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
              {t("actions.save")}
            </button>
          </div>
        </form>
      </AdminWorkspaceSection>
    </div>
  );
}
