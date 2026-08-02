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
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { ProgramCoverImageFileInputPreview } from "@/features/programs/components/program-cover-image-file-input-preview";
import { ProgramCoverImageLightbox } from "@/features/programs/components/program-cover-image-lightbox";
import { Link } from "@/i18n/navigation";
import { listAdminProgramCategories } from "@/services/categories/category-service";
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

function RequiredFieldBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rose-300/45 bg-rose-50/92 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700 shadow-[0_10px_24px_-20px_rgba(190,24,93,0.45)] backdrop-blur">
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
  let categories: Awaited<ReturnType<typeof listAdminProgramCategories>>;

  try {
    categories = await listAdminProgramCategories();
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection
        eyebrow={t("unavailable.eyebrow")}
        title={t("unavailable.title")}
        description={t("unavailable.description")}
        tone="warning"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("unavailable.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const defaultCategoryCode = program?.category ?? categories[0]?.code ?? "";
  const saveAction = saveProgramDraftAction.bind(null, activeLocale, program?.id ?? null);
  const publishAction = publishProgramAction.bind(null, activeLocale, program?.id ?? null);
  const archiveAction = program ? archiveProgramAction.bind(null, activeLocale, program.id) : null;
  const deleteAction = program ? deleteProgramAction.bind(null, activeLocale, program.id) : null;
  const reactivateAction = program ? reactivateProgramAction.bind(null, activeLocale, program.id) : null;
  const formId = `admin-program-form-${program?.id ?? mode}`;
  const pendingDraft = hasPendingDraft(program);
  const publishedProgramInEdit = isEdit && Boolean(program?.publishedSnapshot);
  const hasManagedCategories = categories.length > 0;
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
  const fieldLabelClassName = "flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500";
  const fieldInputClassName = "admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition";
  const textareaClassName = "admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition";
  const contentCardClassName = "admin-inner-panel rounded-[28px] p-6 md:p-7";
  const previewSectionClassName = "admin-program-preview-section";
  const previewSectionContentClassName = "space-y-6 md:space-y-7";

  return (
    <div className="admin-program-preview-shell">
      <div
        aria-hidden="true"
        className="admin-program-preview-background"
        style={{ backgroundImage: "url('/branding/Volcan-Arenal.png')" }}
      />
      <div aria-hidden="true" className="admin-program-preview-overlay" />

      <div className="admin-program-preview-content space-y-8 lg:space-y-10">
        {feedback ? (
          <div
            className={`admin-program-preview-banner rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)] ${feedbackTone}`}
          >
            {t(`feedback.${feedback}`)}
          </div>
        ) : null}

          <div className="admin-program-preview-hero grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] xl:items-end">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/80">
                {isEdit ? t("mode.edit") : t("mode.create")}
              </p>
              <div className="space-y-4">
                <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {t("notice.title")}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-slate-700 md:text-base">
                  {isEdit ? t("intro.edit") : t("intro.create")}
                </p>
              </div>
              <p className="admin-program-preview-hero-note max-w-3xl rounded-[24px] px-5 py-4 text-sm leading-7 text-slate-700">
                {t("notice.body")}
              </p>
            </div>

            <div className="admin-program-preview-legend space-y-3 rounded-[28px] px-5 py-5 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-3">
                <RequiredFieldBadge label={requiredBadgeLabel} />
                <p className="text-sm font-medium text-slate-950">{t("required.legend")}</p>
              </div>
              <p className="text-xs leading-6 text-slate-600">{t("required.help")}</p>
            </div>
          </div>

        {publishedProgramInEdit ? (
          <AdminWorkspaceSection
            title={t("publishedEditWarning.title")}
            description={t("publishedEditWarning.description")}
            tone="warning"
            className={previewSectionClassName}
            contentClassName={previewSectionContentClassName}
          >
            <div className="space-y-4 text-sm leading-7 text-amber-900">
              <p>{t("publishedEditWarning.saveBoundary")}</p>
              <p className="rounded-2xl border border-amber-300/50 bg-amber-50 px-5 py-4 font-medium text-amber-800">
                {t("publishedEditWarning.liveBoundary")}
              </p>
            </div>
          </AdminWorkspaceSection>
        ) : null}

        <AdminWorkspaceSection
          title={t("sections.workflow")}
          description={t("workflow.description")}
          className={previewSectionClassName}
          contentClassName={previewSectionContentClassName}
        >
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/80">{t("rail.eyebrow")}</p>
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
                className={previewSectionClassName}
                contentClassName={previewSectionContentClassName}
              >
                <div className="space-y-6">
                  {locales.map((locale) => (
                    <div key={locale} className={contentCardClassName}>
                      <div className="border-b border-emerald-900/8 pb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/80">
                          {t("translationLocale", { locale: locale.toUpperCase() })}
                        </p>
                      </div>
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
                            className={fieldInputClassName}
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
                            className={textareaClassName}
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
                            className={textareaClassName}
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
                className={previewSectionClassName}
                contentClassName={previewSectionContentClassName}
              >
                <div className="space-y-5">
                  {!hasManagedCategories ? (
                    <div className="rounded-[24px] border border-amber-300/45 bg-amber-50/92 px-5 py-4 text-sm leading-7 text-amber-900 shadow-[0_18px_36px_-30px_rgba(180,83,9,0.4)] backdrop-blur">
                      {t("categoryEmptyState")}
                    </div>
                  ) : null}

                  <div className="grid gap-5 lg:grid-cols-2">
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
                          className={fieldLabelClassName}
                        />
                        <input
                          name={`${field.key}.${activeLocale}`}
                          defaultValue={field.value}
                          placeholder={field.placeholder}
                          className={fieldInputClassName}
                        />
                      </label>
                    ))}

                    <label className="admin-inner-panel flex flex-col gap-3 rounded-[24px] p-5 text-sm text-slate-700">
                      <span className={fieldLabelClassName}>{t("fields.category")}</span>
                      <select
                        name="category"
                        defaultValue={defaultCategoryCode}
                        disabled={!hasManagedCategories}
                        className={fieldInputClassName}
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.code}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="admin-inner-panel flex items-start gap-4 rounded-[24px] p-5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={program?.featured ?? false}
                      className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-emerald-700"
                    />
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950">{t("fields.featured")}</p>
                      <p className="text-sm leading-7 text-slate-600">{t("fields.featuredToggle")}</p>
                    </div>
                  </label>
                </div>
              </AdminWorkspaceSection>

              <AdminWorkspaceSection
                title={coverImageSectionTitle}
                description={coverImageSectionDescription}
                className={previewSectionClassName}
                contentClassName={previewSectionContentClassName}
              >
                <div className="admin-inner-panel space-y-5 rounded-[28px] p-6 text-sm text-slate-700 md:p-7">
                  <LabelWithMarker
                    label={t("fields.coverImage")}
                    markerLabel={requiredBadgeLabel}
                    required={isProgramPublishRequiredField("coverImage")}
                    className={fieldLabelClassName}
                  />
                  <ProgramCoverImageFileInputPreview
                    name="coverImageFile"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    coverImageLabel={t("fields.coverImage")}
                    description={t("coverImageUpload.description")}
                    publishBoundary={t("coverImageUpload.publishBoundary")}
                    previewTitle={t("coverImageUpload.selectedPreview")}
                    previewAlt={t("coverImageUpload.selectedPreviewAlt")}
                    selectedFileLabel={t("coverImageUpload.selectedFile")}
                  />

                  {program?.publishedSnapshot?.coverImage ? (
                    <div className="space-y-5 pt-1">
                      <div className="admin-inner-panel-subtle rounded-2xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("coverImageUpload.currentPublished")}
                        </p>
                        <ProgramCoverImageLightbox
                          imageSrc={program.publishedSnapshot.coverImage}
                          imageAlt={t("coverImageUpload.currentPublishedAlt")}
                          previewHintLabel={t("coverImageUpload.openPublishedLarge")}
                          dialogTitle={t("coverImageUpload.previewDialogTitle")}
                          closeLabel={t("coverImageUpload.closePreview")}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.requirements")}
              description={t("descriptions.requirements")}
              className={previewSectionClassName}
              contentClassName={previewSectionContentClassName}
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
                  className={textareaClassName}
                />
              </label>
            </AdminWorkspaceSection>

            <AdminWorkspaceSection
              title={t("sections.included")}
              description={t("descriptions.included")}
              className={previewSectionClassName}
              contentClassName={previewSectionContentClassName}
            >
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
                  className={textareaClassName}
                />
              </label>
            </AdminWorkspaceSection>

               <section className="admin-program-action-rail-panel admin-program-bottom-actions rounded-[28px] p-4 md:p-5 lg:hidden">
                <div className="space-y-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/80">{t("rail.eyebrow")}</p>
                  <ProgramEditorActions
                    t={t}
                    formId={formId}
                    isEdit={isEdit}
                    saveAction={saveAction}
                    reactivateAction={reactivateAction}
                    archiveAction={archiveAction}
                    deleteAction={deleteAction}
                    programStatus={program?.status}
                  />
                </div>
              </section>

            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
