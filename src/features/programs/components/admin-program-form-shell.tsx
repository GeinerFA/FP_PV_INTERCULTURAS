/* eslint-disable @next/next/no-img-element */

import type { ComponentProps } from "react";

import { getLocale, getTranslations } from "next-intl/server";

import { locales, type AppLocale } from "@/config/i18n";
import {
  archiveProgramAction,
  deleteProgramAction,
  publishProgramAction,
  reactivateProgramAction,
  saveProgramDraftAction,
} from "@/app/[locale]/admin/programs/actions";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { Link } from "@/i18n/navigation";
import type { Program, ProgramSnapshot } from "@/types/program";
import { isProgramPublishRequiredField } from "@/validators/program";

type AdminProgramFormShellProps = {
  mode: "create" | "edit";
  program?: Program | null;
  feedback?:
    | "draft-saved"
    | "published"
    | "archived"
    | "reactivated"
    | "deleted"
    | "destructive-confirmation-required"
    | "invalid"
    | "invalid-image-type"
    | "image-too-large"
    | "save-failed"
    | "publish-failed"
    | "delete-failed";
};

function getFieldValue(program: Program | null | undefined, field: string) {
  return field;
}

function getLines(values: string[] | undefined): string {
  return values?.join("\n") ?? "";
}

function hasPendingDraft(program: Program | null | undefined): boolean {
  if (!program?.publishedSnapshot) {
    return false;
  }

  const normalizeSnapshotForDraftComparison = (snapshot: ProgramSnapshot) => ({
    ...snapshot,
    coverImage:
      snapshot.coverImageAsset && snapshot.coverImage.startsWith("/api/programs/")
        ? "__internal-program-cover-image__"
        : snapshot.coverImage,
  });

  return (
    JSON.stringify(normalizeSnapshotForDraftComparison(program.draftSnapshot)) !==
    JSON.stringify(normalizeSnapshotForDraftComparison(program.publishedSnapshot))
  );
}

function formatFileSize(sizeBytes: number | undefined): string | null {
  if (typeof sizeBytes !== "number" || Number.isNaN(sizeBytes)) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RequiredFieldBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rose-300/50 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">
      {label}
    </span>
  );
}

function LabelWithMarker({
  label,
  markerLabel,
  required,
  className,
}: {
  label: string;
  markerLabel: string;
  required: boolean;
  className: string;
}) {
  return (
    <span className={className}>
      <span>{label}</span>
      {required ? <RequiredFieldBadge label={markerLabel} /> : null}
    </span>
  );
}

type ProgramEditorActionsProps = {
  t: Awaited<ReturnType<typeof getTranslations>>;
  formId: string;
  isEdit: boolean;
  saveAction: ComponentProps<"button">["formAction"];
  reactivateAction: ComponentProps<"button">["formAction"] | null;
  archiveAction: ComponentProps<"button">["formAction"] | null;
  deleteAction: ComponentProps<"button">["formAction"] | null;
  programStatus: Program["status"] | undefined;
  compact?: boolean;
};

function ProgramEditorActions({
  t,
  formId,
  isEdit,
  saveAction,
  reactivateAction,
  archiveAction,
  deleteAction,
  programStatus,
  compact = false,
}: ProgramEditorActionsProps) {
  const buttonClassName = compact ? "px-3.5 py-2 text-[0.8125rem]" : "px-5 py-3 text-sm";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5">
        <button
          type="submit"
          form={formId}
          className={`admin-primary-action inline-flex w-full items-center justify-center rounded-full font-semibold transition ${buttonClassName}`}
        >
          {isEdit ? t("actions.updateAndPublish") : t("actions.addAndPublish")}
        </button>
        <button
          type="submit"
          form={formId}
          formAction={saveAction}
          className={`admin-secondary-action inline-flex w-full items-center justify-center rounded-full font-semibold transition ${buttonClassName}`}
        >
          {t("actions.saveDraft")}
        </button>
        <Link
          href="/admin/programs"
          className={`admin-outline-action inline-flex w-full items-center justify-center rounded-full font-semibold transition ${buttonClassName}`}
        >
          {t("actions.backToOverview")}
        </Link>
      </div>

      {isEdit ? (
        <div className="space-y-3 border-t border-emerald-900/8 pt-3.5">
          {programStatus === "archived" && reactivateAction ? (
            <button
              type="submit"
              form={formId}
              formAction={reactivateAction}
              className={`admin-info-action inline-flex w-full items-center justify-center rounded-full font-semibold transition ${buttonClassName}`}
            >
              {t("actions.reactivate")}
            </button>
          ) : null}

          {programStatus !== "archived" && archiveAction ? (
            <DestructiveActionConfirmation
              title={t("destructive.archive.title")}
              description={t("destructive.archive.description")}
              warning={t("destructive.archive.warning")}
              triggerLabel={t("actions.archive")}
              confirmLabel={t("destructive.archive.confirm")}
              cancelLabel={t("destructive.cancel")}
              confirmValue="archive"
              formId={formId}
              formAction={archiveAction}
              tone="warning"
              actionLayout="stacked"
              className="w-full"
            />
          ) : null}

          {deleteAction ? (
            <DestructiveActionConfirmation
              title={t("destructive.delete.title")}
              description={t("destructive.delete.description")}
              warning={t("destructive.delete.warning")}
              triggerLabel={t("actions.delete")}
              confirmLabel={t("destructive.delete.confirm")}
              cancelLabel={t("destructive.cancel")}
              confirmValue="delete"
              formId={formId}
              formAction={deleteAction}
              tone="danger"
              actionLayout="stacked"
              className="w-full"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export async function AdminProgramFormShell({
  mode,
  program,
  feedback,
}: AdminProgramFormShellProps) {
  const isEdit = mode === "edit";
  const [t, locale] = await Promise.all([
    getTranslations("AdminProgramForm"),
    getLocale(),
  ]);
  const activeLocale = locale as AppLocale;
  const saveAction = saveProgramDraftAction.bind(null, activeLocale, program?.id ?? null);
  const publishAction = publishProgramAction.bind(null, activeLocale, program?.id ?? null);
  const archiveAction = program ? archiveProgramAction.bind(null, activeLocale, program.id) : null;
  const deleteAction = program ? deleteProgramAction.bind(null, activeLocale, program.id) : null;
  const reactivateAction = program ? reactivateProgramAction.bind(null, activeLocale, program.id) : null;
  const formId = `admin-program-form-${program?.id ?? mode}`;
  const pendingDraft = hasPendingDraft(program);
  const publishedProgramInEdit = isEdit && Boolean(program?.publishedSnapshot);
  const coverImageSectionTitle = t.has("sections.coverImage") ? t("sections.coverImage") : t("fields.coverImage");
  const coverImageSectionDescription = t.has("descriptions.coverImage")
    ? t("descriptions.coverImage")
    : t("coverImageUpload.description");
  const requiredBadgeLabel = t("required.badge");
  const feedbackTone =
    feedback === "invalid" ||
    feedback === "invalid-image-type" ||
    feedback === "image-too-large" ||
    feedback === "save-failed" ||
    feedback === "publish-failed" ||
    feedback === "delete-failed" ||
    feedback === "destructive-confirmation-required"
      ? "admin-warning-banner"
      : "admin-success-banner";

  return (
    <div className="space-y-10 lg:space-y-12">
      {feedback ? (
        <div
          className={`rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)] ${feedbackTone}`}
        >
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,232,0.84))] p-7 text-sm leading-7 text-slate-700 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.16)] backdrop-blur md:p-8">
        <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800/90">
          {isEdit ? t("mode.edit") : t("mode.create")}
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">{t("notice.title")}</h2>
        <p className="mt-4 max-w-3xl">{isEdit ? t("intro.edit") : t("intro.create")}</p>
        <p className="mt-5 rounded-2xl border border-emerald-900/8 bg-white/66 px-5 py-4 text-sm text-slate-700">
          {t("notice.body")}
        </p>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-900/8 bg-emerald-50/55 px-5 py-4 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <RequiredFieldBadge label={requiredBadgeLabel} />
            <p className="text-sm font-medium text-slate-900">{t("required.legend")}</p>
          </div>
          <p className="max-w-3xl text-xs leading-6 text-slate-500">{t("required.help")}</p>
        </div>
      </div>

      {publishedProgramInEdit ? (
        <AdminWorkspaceSection
          title={t("publishedEditWarning.title")}
          description={t("publishedEditWarning.description")}
          tone="warning"
        >
          <div className="space-y-4 text-sm leading-7 text-amber-900">
            <p>{t("publishedEditWarning.saveBoundary")}</p>
            <p className="rounded-2xl border border-amber-300/50 bg-amber-50 px-5 py-4 font-medium text-amber-800">
              {t("publishedEditWarning.liveBoundary")}
            </p>
          </div>
        </AdminWorkspaceSection>
      ) : null}

      <AdminWorkspaceSection title={t("sections.workflow")} description={t("workflow.description")}>
        <div className="space-y-4 text-sm text-slate-700">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="admin-inner-panel-subtle rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("rail.statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{t(`statuses.${program?.status ?? "draft"}`)}</p>
            </div>

            {isEdit ? (
              <div className="admin-inner-panel-subtle rounded-2xl px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("rail.pendingDraftLabel")}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{pendingDraft ? t("yes") : t("no")}</p>
              </div>
            ) : null}
          </div>

          <p className="admin-inner-panel-subtle rounded-2xl px-5 py-4 text-sm leading-7 text-slate-600">{t("rail.noteBody")}</p>
        </div>
      </AdminWorkspaceSection>

      <div className="admin-program-editor-shell">
        <aside className="admin-program-action-rail">
          <div className="admin-program-action-rail-sticky">
            <section className="admin-program-action-rail-panel admin-action-rail-panel admin-action-rail-panel-compact rounded-[28px] p-4 md:p-5">
              <div className="space-y-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/85">{t("rail.eyebrow")}</p>
                <ProgramEditorActions
                  t={t}
                  formId={formId}
                  isEdit={isEdit}
                  saveAction={saveAction}
                  reactivateAction={reactivateAction}
                  archiveAction={archiveAction}
                  deleteAction={deleteAction}
                  programStatus={program?.status}
                  compact
                />
              </div>
            </section>
          </div>
        </aside>

        <form id={formId} className="admin-program-form-flow space-y-8 lg:space-y-10" action={publishAction}>
          <input type="hidden" name="coverImage" defaultValue={program?.coverImage ?? ""} />

          <div className="admin-program-editor-layout">
            <div className="space-y-8 lg:space-y-10">
            <AdminWorkspaceSection
              title={t("sections.localizedPresentation")}
              description={t("descriptions.localizedPresentation")}
            >
              <div className="space-y-6">
                {locales.map((locale) => (
                  <div key={locale} className="admin-inner-panel rounded-[28px] p-6 md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/80">
                      {t("translationLocale", { locale: locale.toUpperCase() })}
                    </p>
                    <div className="mt-5 space-y-5 text-sm text-slate-700">
                      <label className="block space-y-2.5">
                        <LabelWithMarker
                          label={t("fields.title")}
                          markerLabel={requiredBadgeLabel}
                          required={isProgramPublishRequiredField("translations.title")}
                          className="flex flex-wrap items-center gap-2 font-semibold text-slate-950"
                        />
                        <input
                          name={`translations.${locale}.title`}
                          defaultValue={program?.translations[locale].title ?? ""}
                          placeholder={getFieldValue(program, t("placeholders.programTitle"))}
                          className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </label>
                      <label className="block space-y-2.5">
                        <LabelWithMarker
                          label={t("fields.shortDescription")}
                          markerLabel={requiredBadgeLabel}
                          required={isProgramPublishRequiredField("translations.shortDescription")}
                          className="flex flex-wrap items-center gap-2 font-semibold text-slate-950"
                        />
                        <textarea
                          name={`translations.${locale}.shortDescription`}
                          defaultValue={program?.translations[locale].shortDescription ?? ""}
                          placeholder={getFieldValue(program, t("placeholders.shortDescription"))}
                          rows={3}
                          className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </label>
                      <label className="block space-y-2.5">
                        <LabelWithMarker
                          label={t("fields.fullDescription")}
                          markerLabel={requiredBadgeLabel}
                          required={isProgramPublishRequiredField("translations.fullDescription")}
                          className="flex flex-wrap items-center gap-2 font-semibold text-slate-950"
                        />
                        <textarea
                          name={`translations.${locale}.fullDescription`}
                          defaultValue={program?.translations[locale].fullDescription ?? ""}
                          placeholder={getFieldValue(program, t("placeholders.fullDescription"))}
                          rows={7}
                          className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.operationalDetails")}
              description={t("descriptions.operationalDetails")}
            >
              <div className="space-y-5">
                {[
                  {
                    key: "location",
                    label: t("fields.location"),
                    value: program ? program.location[activeLocale] : "",
                    placeholder: t("placeholders.localizedLocation"),
                  },
                  {
                    key: "duration",
                    label: t("fields.duration"),
                    value: program ? program.duration[activeLocale] : "",
                    placeholder: t("placeholders.localizedDuration"),
                  },
                  {
                    key: "availability",
                    label: t("fields.availability"),
                    value: program ? program.availability[activeLocale] : "",
                    placeholder: t("placeholders.localizedAvailability"),
                  },
                ].map((field) => (
                  <label key={field.key} className="admin-inner-panel flex flex-col gap-3 rounded-[24px] p-5 text-sm text-slate-700">
                    <LabelWithMarker
                      label={field.label}
                      markerLabel={requiredBadgeLabel}
                      required={isProgramPublishRequiredField(field.key as "location" | "duration" | "availability")}
                      className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    />
                    <input
                      name={`${field.key}.${activeLocale}`}
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>
                ))}

                <label className="admin-inner-panel flex flex-col gap-3 rounded-[24px] p-5 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("fields.category")}
                  </span>
                  <select
                    name="category"
                    defaultValue={program?.category ?? "volunteer"}
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  >
                    <option value="volunteer">{t("categories.volunteer")}</option>
                    <option value="internships">{t("categories.internships")}</option>
                    <option value="spanish-classes">{t("categories.spanish-classes")}</option>
                  </select>
                </label>

                <label className="admin-inner-panel flex items-center gap-4 rounded-[24px] p-5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={program?.featured ?? false}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-700"
                  />
                  <span>{t("fields.featuredToggle")}</span>
                </label>
              </div>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection title={coverImageSectionTitle} description={coverImageSectionDescription}>
              <div className="admin-inner-panel space-y-4 rounded-[28px] p-6 text-sm text-slate-700 md:p-7">
                <LabelWithMarker
                  label={t("fields.coverImage")}
                  markerLabel={requiredBadgeLabel}
                  required={isProgramPublishRequiredField("coverImage")}
                  className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                />
                <label className="block">
                  <span className="sr-only">{t("fields.coverImage")}</span>
                  <input
                    type="file"
                    name="coverImageFile"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="admin-inner-input block w-full rounded-2xl border-dashed px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
                  />
                </label>
                <p className="text-sm leading-7 text-slate-600">{t("coverImageUpload.description")}</p>
                <p className="text-xs leading-6 text-slate-500">{t("coverImageUpload.publishBoundary")}</p>

                {program?.coverImage ? (
                  <div className="space-y-5 pt-1">
                    <div className="admin-inner-panel-subtle rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("coverImageUpload.currentDraft")}
                      </p>
                      <img
                        src={program.coverImage}
                        alt={t("coverImageUpload.currentDraftAlt")}
                        className="mt-3 h-48 w-full rounded-2xl object-cover"
                      />
                      {program.draftSnapshot.coverImageAsset ? (
                        <p className="mt-4 text-xs text-slate-500">
                          {program.draftSnapshot.coverImageAsset.fileName}
                          {formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)
                            ? ` · ${formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    {program.publishedSnapshot?.coverImage ? (
                      <div className="admin-inner-panel-subtle rounded-2xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("coverImageUpload.currentPublished")}
                        </p>
                        <img
                          src={program.publishedSnapshot.coverImage}
                          alt={t("coverImageUpload.currentPublishedAlt")}
                          className="mt-3 h-48 w-full rounded-2xl object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.requirements")}
              description={t("descriptions.requirements")}
            >
              <label className="admin-inner-panel block rounded-[28px] p-5 text-sm text-slate-700 md:p-6">
                <LabelWithMarker
                  label={t("sections.requirements")}
                  markerLabel={requiredBadgeLabel}
                  required={isProgramPublishRequiredField("translations.requirements")}
                  className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                />
                <textarea
                  name={`translations.${activeLocale}.requirements`}
                  defaultValue={getLines(program?.translations[activeLocale].requirements)}
                  placeholder={t("placeholders.requirementsLines")}
                  rows={8}
                  className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                />
              </label>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection title={t("sections.included")} description={t("descriptions.included")}>
              <label className="admin-inner-panel block rounded-[28px] p-5 text-sm text-slate-700 md:p-6">
                <LabelWithMarker
                  label={t("sections.included")}
                  markerLabel={requiredBadgeLabel}
                  required={isProgramPublishRequiredField("translations.included")}
                  className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                />
                <textarea
                  name={`translations.${activeLocale}.included`}
                  defaultValue={getLines(program?.translations[activeLocale].included)}
                  placeholder={t("placeholders.includedLines")}
                  rows={8}
                  className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                />
              </label>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.seoAuditPreview")}
              description={t("seoAuditDescription")}
              tone="subtle"
            >
              <div className="space-y-5">
                <label className="block space-y-2.5 text-sm text-slate-700">
                  <LabelWithMarker
                    label={t("fields.seoTitle")}
                    markerLabel={requiredBadgeLabel}
                    required={isProgramPublishRequiredField("seo.title")}
                    className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  />
                  <input
                    name={`seo.${activeLocale}.title`}
                    defaultValue={program?.seo[activeLocale].title ?? ""}
                    placeholder={t("placeholders.seoTitle")}
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  />
                </label>
                <label className="block space-y-2.5 text-sm text-slate-700">
                  <LabelWithMarker
                    label={t("fields.seoDescription")}
                    markerLabel={requiredBadgeLabel}
                    required={isProgramPublishRequiredField("seo.description")}
                    className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  />
                  <textarea
                    name={`seo.${activeLocale}.description`}
                    defaultValue={program?.seo[activeLocale].description ?? ""}
                    placeholder={t("placeholders.seoDescription")}
                    rows={4}
                    className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  />
                </label>
              </div>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.editorialMeta")}
              description={t("descriptions.editorialMeta")}
              tone="subtle"
            >
              <div className="space-y-5 text-sm text-slate-700">
                <div className="admin-inner-panel-subtle rounded-2xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("fields.internalId")}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">{program?.id ?? t("placeholders.generatedOnSave")}</p>
                </div>

                <label className="block space-y-2.5">
                  <LabelWithMarker
                    label={t("fields.slug")}
                    markerLabel={requiredBadgeLabel}
                    required={isProgramPublishRequiredField("slug")}
                    className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  />
                  <input
                    name="slug"
                    defaultValue={program?.slug ?? ""}
                    placeholder={t("placeholders.futureSlug")}
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  />
                </label>

                <div className="admin-inner-panel-subtle rounded-2xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("fields.status")}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">{t(`statuses.${program?.status ?? "draft"}`)}</p>
                </div>

                <div className="admin-inner-panel-subtle rounded-2xl px-5 py-5 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <p>
                    {t("audit.createdBy")}: {program?.createdBy ?? t("placeholders.pendingWorkflow")}
                  </p>
                  <p className="mt-2">
                    {t("audit.updatedBy")}: {program?.updatedBy ?? t("placeholders.pendingWorkflow")}
                  </p>
                  <p className="mt-2">
                    {t("audit.createdAt")}: {program?.createdAt ?? t("placeholders.autoGenerated")}
                  </p>
                  <p className="mt-2">
                    {t("audit.updatedAt")}: {program?.updatedAt ?? t("placeholders.autoGenerated")}
                  </p>
                  <p className="mt-2">
                    {t("audit.firstPublishedAt")}: {program?.firstPublishedAt ?? t("placeholders.notPublishedYet")}
                  </p>
                  <p className="mt-2">
                    {t("audit.pendingDraft")}: {pendingDraft ? t("yes") : t("no")}
                  </p>
                </div>
              </div>
            </AdminWorkspaceSection>

             <AdminWorkspaceSection title={t("sections.boundaries")} tone="subtle">
               <ul className="space-y-4 text-sm leading-7 text-slate-600">
                 {[t("boundaries.0"), t("boundaries.1"), t("boundaries.2")].map((item) => (
                  <li key={item} className="admin-inner-panel-subtle rounded-2xl px-5 py-4">
                    {item}
                  </li>
                ))}
              </ul>
             </AdminWorkspaceSection>

             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
