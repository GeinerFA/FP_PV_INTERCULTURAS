/* eslint-disable @next/next/no-img-element */

import { getLocale, getTranslations } from "next-intl/server";

import { locales, type AppLocale } from "@/config/i18n";
import {
  archiveProgramAction,
  publishProgramAction,
  reactivateProgramAction,
  saveProgramDraftAction,
} from "@/app/[locale]/admin/programs/actions";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { Link } from "@/i18n/navigation";
import type { Program, ProgramSnapshot } from "@/types/program";

type AdminProgramFormShellProps = {
  mode: "create" | "edit";
  program?: Program | null;
  feedback?:
    | "draft-saved"
    | "published"
    | "archived"
    | "reactivated"
    | "invalid"
    | "invalid-image-type"
    | "image-too-large"
    | "save-failed"
    | "publish-failed";
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
  const reactivateAction = program ? reactivateProgramAction.bind(null, activeLocale, program.id) : null;
  const pendingDraft = hasPendingDraft(program);
  const publishedProgramInEdit = isEdit && Boolean(program?.publishedSnapshot);
  const coverImageSectionTitle = t.has("sections.coverImage") ? t("sections.coverImage") : t("fields.coverImage");
  const coverImageSectionDescription = t.has("descriptions.coverImage")
    ? t("descriptions.coverImage")
    : t("coverImageUpload.description");
  const feedbackTone =
    feedback === "invalid" ||
    feedback === "invalid-image-type" ||
    feedback === "image-too-large" ||
    feedback === "save-failed" ||
    feedback === "publish-failed"
      ? "border-amber-400/30 bg-amber-500/12 text-amber-100"
      : "border-emerald-400/30 bg-emerald-500/12 text-emerald-100";

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-[28px] border px-4 py-3 text-sm leading-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)] ${feedbackTone}`}
        >
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))] p-6 text-sm leading-7 text-slate-300 shadow-[0_24px_60px_-48px_rgba(2,6,23,0.95)] backdrop-blur">
        <p className="font-semibold uppercase tracking-[0.18em] text-teal-200/90">
          {isEdit ? t("mode.edit") : t("mode.create")}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-50">{t("notice.title")}</h2>
        <p className="mt-3">{isEdit ? t("intro.edit") : t("intro.create")}</p>
        <p className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
          {t("notice.body")}
        </p>
      </div>

      {publishedProgramInEdit ? (
        <AdminWorkspaceSection
          title={t("publishedEditWarning.title")}
          description={t("publishedEditWarning.description")}
          tone="warning"
        >
          <div className="space-y-3 text-sm leading-7 text-amber-50">
            <p>{t("publishedEditWarning.saveBoundary")}</p>
            <p className="rounded-2xl border border-amber-300/30 bg-slate-950/35 px-4 py-3 font-medium text-amber-100">
              {t("publishedEditWarning.liveBoundary")}
            </p>
          </div>
        </AdminWorkspaceSection>
      ) : null}

      <form className="space-y-6" action={saveAction}>
        <input type="hidden" name="coverImage" defaultValue={program?.coverImage ?? ""} />

        <AdminWorkspaceSection
          title={t("sections.localizedPresentation")}
          description={t("descriptions.localizedPresentation")}
        >
          <div className="space-y-4">
            {locales.map((locale) => (
              <div key={locale} className="admin-inner-panel rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">
                  {t("translationLocale", { locale: locale.toUpperCase() })}
                </p>
                <div className="mt-4 space-y-4 text-sm text-slate-200">
                  <label className="block">
                    <span className="font-semibold text-slate-50">{t("fields.title")}</span>
                    <input
                      name={`translations.${locale}.title`}
                      defaultValue={program?.translations[locale].title ?? ""}
                      placeholder={getFieldValue(program, t("placeholders.programTitle"))}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>
                  <label className="block">
                    <span className="font-semibold text-slate-50">{t("fields.shortDescription")}</span>
                    <textarea
                      name={`translations.${locale}.shortDescription`}
                      defaultValue={program?.translations[locale].shortDescription ?? ""}
                      placeholder={getFieldValue(program, t("placeholders.shortDescription"))}
                      rows={3}
                      className="admin-inner-input mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>
                  <label className="block">
                    <span className="font-semibold text-slate-50">{t("fields.fullDescription")}</span>
                    <textarea
                      name={`translations.${locale}.fullDescription`}
                      defaultValue={program?.translations[locale].fullDescription ?? ""}
                      placeholder={getFieldValue(program, t("placeholders.fullDescription"))}
                      rows={7}
                      className="admin-inner-input mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
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
          <div className="space-y-4">
            {[{
              key: "location",
              label: t("fields.location"),
              value: program ? program.location[activeLocale] : "",
              placeholder: t("placeholders.localizedLocation"),
            }, {
              key: "duration",
              label: t("fields.duration"),
              value: program ? program.duration[activeLocale] : "",
              placeholder: t("placeholders.localizedDuration"),
            }, {
              key: "availability",
              label: t("fields.availability"),
              value: program ? program.availability[activeLocale] : "",
              placeholder: t("placeholders.localizedAvailability"),
            }].map((field) => (
              <label key={field.key} className="admin-inner-panel rounded-2xl p-4 text-sm text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {field.label}
                </span>
                <input
                  name={`${field.key}.${activeLocale}`}
                  defaultValue={field.value}
                  placeholder={field.placeholder}
                  className="admin-inner-input mt-3 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                />
              </label>
            ))}

            <label className="admin-inner-panel rounded-2xl p-4 text-sm text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.category")}
              </span>
              <select
                name="category"
                defaultValue={program?.category ?? "volunteer"}
                className="admin-inner-input mt-3 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
              >
                <option value="volunteer">{t("categories.volunteer")}</option>
                <option value="internships">{t("categories.internships")}</option>
                <option value="spanish-classes">{t("categories.spanish-classes")}</option>
              </select>
            </label>

            <label className="admin-inner-panel flex items-center gap-3 rounded-2xl p-4 text-sm text-slate-200">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={program?.featured ?? false}
                className="h-4 w-4 rounded border-slate-500 bg-slate-950/50 text-teal-400"
              />
              <span>{t("fields.featuredToggle")}</span>
            </label>
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={coverImageSectionTitle} description={coverImageSectionDescription}>
          <div className="admin-inner-panel rounded-[28px] p-5 text-sm text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("fields.coverImage")}
            </span>
            <label className="mt-3 block">
              <span className="sr-only">{t("fields.coverImage")}</span>
              <input
                type="file"
                name="coverImageFile"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="admin-inner-input block w-full rounded-2xl border-dashed px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-teal-400"
              />
            </label>
            <p className="mt-3 text-sm leading-6 text-slate-300">{t("coverImageUpload.description")}</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">{t("coverImageUpload.publishBoundary")}</p>

            {program?.coverImage ? (
              <div className="mt-4 space-y-4">
                <div className="admin-inner-panel-subtle rounded-2xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t("coverImageUpload.currentDraft")}
                  </p>
                  <img
                    src={program.coverImage}
                    alt={t("coverImageUpload.currentDraftAlt")}
                    className="mt-3 h-48 w-full rounded-2xl object-cover"
                  />
                  {program.draftSnapshot.coverImageAsset ? (
                    <p className="mt-3 text-xs text-slate-400">
                      {program.draftSnapshot.coverImageAsset.fileName}
                      {formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)
                        ? ` · ${formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)}`
                        : ""}
                    </p>
                  ) : null}
                </div>

                {program.publishedSnapshot?.coverImage ? (
                  <div className="admin-inner-panel-subtle rounded-2xl p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
          <label className="block text-sm text-slate-200">
            <span className="sr-only">{t("sections.requirements")}</span>
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
          <label className="block text-sm text-slate-200">
            <span className="sr-only">{t("sections.included")}</span>
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
          <div className="space-y-4">
            <label className="block text-sm text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.seoTitle")}
              </span>
              <input
                name={`seo.${activeLocale}.title`}
                defaultValue={program?.seo[activeLocale].title ?? ""}
                placeholder={t("placeholders.seoTitle")}
                className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
              />
            </label>
            <label className="block text-sm text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.seoDescription")}
              </span>
              <textarea
                name={`seo.${activeLocale}.description`}
                defaultValue={program?.seo[activeLocale].description ?? ""}
                placeholder={t("placeholders.seoDescription")}
                rows={4}
                className="admin-inner-input mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
              />
            </label>
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={t("sections.workflow")} description={t("workflow.description")}>
          <div className="space-y-3">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              {isEdit ? t("actions.update") : t("actions.saveDraft")}
            </button>
            <button
              type="submit"
              formAction={publishAction}
              className="inline-flex w-full items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/16"
            >
              {t("actions.publish")}
            </button>
            <Link
              href="/admin/programs"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800/80"
            >
              {t("actions.backToOverview")}
            </Link>
          </div>

          {isEdit && archiveAction && reactivateAction ? (
            <div className="mt-5 border-t border-slate-700 pt-5">
              {program?.status === "archived" ? (
                <button
                  type="submit"
                  formAction={reactivateAction}
                  className="inline-flex w-full items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/16"
                >
                  {t("actions.reactivate")}
                </button>
              ) : (
                <button
                  type="submit"
                  formAction={archiveAction}
                  className="inline-flex w-full items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/16"
                >
                  {t("actions.archive")}
                </button>
              )}
            </div>
          ) : null}
        </AdminWorkspaceSection>

        <AdminWorkspaceSection
          title={t("sections.editorialMeta")}
          description={t("descriptions.editorialMeta")}
          tone="subtle"
        >
          <div className="space-y-4 text-sm text-slate-200">
            <div className="admin-inner-panel-subtle rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.internalId")}
              </p>
              <p className="mt-2 text-sm text-slate-100">{program?.id ?? t("placeholders.generatedOnSave")}</p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.slug")}
              </span>
              <input
                name="slug"
                defaultValue={program?.slug ?? ""}
                placeholder={t("placeholders.futureSlug")}
                className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
              />
            </label>

            <div className="admin-inner-panel-subtle rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("fields.status")}
              </p>
              <p className="mt-2 text-sm text-slate-100">{t(`statuses.${program?.status ?? "draft"}`)}</p>
            </div>

            <div className="admin-inner-panel-subtle rounded-2xl px-4 py-4 text-xs uppercase tracking-[0.18em] text-slate-400">
              <p>{t("audit.createdBy")}: {program?.createdBy ?? t("placeholders.pendingWorkflow")}</p>
              <p className="mt-2">{t("audit.updatedBy")}: {program?.updatedBy ?? t("placeholders.pendingWorkflow")}</p>
              <p className="mt-2">{t("audit.createdAt")}: {program?.createdAt ?? t("placeholders.autoGenerated")}</p>
              <p className="mt-2">{t("audit.updatedAt")}: {program?.updatedAt ?? t("placeholders.autoGenerated")}</p>
              <p className="mt-2">{t("audit.firstPublishedAt")}: {program?.firstPublishedAt ?? t("placeholders.notPublishedYet")}</p>
              <p className="mt-2">{t("audit.pendingDraft")}: {pendingDraft ? t("yes") : t("no")}</p>
            </div>
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={t("sections.boundaries")} tone="subtle">
          <ul className="space-y-3 text-sm leading-7 text-slate-300">
            {[t("boundaries.0"), t("boundaries.1"), t("boundaries.2")].map((item) => (
              <li key={item} className="admin-inner-panel-subtle rounded-2xl px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </AdminWorkspaceSection>
      </form>
    </div>
  );
}
