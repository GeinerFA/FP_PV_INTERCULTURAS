/* eslint-disable @next/next/no-img-element */

import { getLocale, getTranslations } from "next-intl/server";

import { locales, type AppLocale } from "@/config/i18n";
import {
  archiveProgramAction,
  publishProgramAction,
  reactivateProgramAction,
  saveProgramDraftAction,
} from "@/app/[locale]/admin/programs/actions";
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
        <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)] ${feedbackTone}`}>
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="rounded-3xl border border-teal-400/25 bg-teal-500/12 p-6 text-sm leading-7 text-teal-50 shadow-[0_24px_60px_-48px_rgba(20,184,166,0.7)] backdrop-blur">
        <p className="font-semibold uppercase tracking-[0.18em] text-teal-200">
          {isEdit ? t("mode.edit") : t("mode.create")}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{t("notice.title")}</h2>
        <p className="mt-3">
          {isEdit
            ? t("intro.edit")
            : t("intro.create")}
        </p>
        <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-teal-50">
          {t("notice.body")}
        </p>
      </div>

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        action={saveAction}
      >
        <input type="hidden" name="coverImage" defaultValue={program?.coverImage ?? ""} />
        <section className="space-y-6">
          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.coreIdentity")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="surface-dark-panel rounded-2xl p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("fields.internalId")}
                </p>
                <p className="mt-2 text-sm text-slate-100">{program?.id ?? t("placeholders.generatedOnSave")}</p>
              </div>

              <label className="surface-dark-panel rounded-2xl p-4 text-sm text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("fields.slug")}
                </span>
                <input
                  name="slug"
                  defaultValue={program?.slug ?? ""}
                  placeholder={t("placeholders.futureSlug")}
                  className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>

              <label className="surface-dark-panel rounded-2xl p-4 text-sm text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("fields.category")}
                </span>
                <select
                  name="category"
                  defaultValue={program?.category ?? "volunteer"}
                  className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="volunteer">{t("categories.volunteer")}</option>
                  <option value="internships">{t("categories.internships")}</option>
                  <option value="spanish-classes">{t("categories.spanish-classes")}</option>
                </select>
              </label>

              <div className="surface-dark-panel rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("fields.status")}
                </p>
                <p className="mt-2 text-sm text-slate-100">{t(`statuses.${program?.status ?? "draft"}`)}</p>
              </div>

              <div className="surface-dark-panel rounded-2xl p-4 text-sm text-slate-200 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("fields.coverImage")}
                </span>
                <label className="mt-3 block">
                  <span className="sr-only">{t("fields.coverImage")}</span>
                  <input
                    type="file"
                    name="coverImageFile"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="block w-full rounded-2xl border border-dashed border-white/15 bg-slate-950 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-teal-400"
                  />
                </label>
                <p className="mt-3 text-sm leading-6 text-slate-400">{t("coverImageUpload.description")}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{t("coverImageUpload.publishBoundary")}</p>

                {program?.coverImage ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("coverImageUpload.currentDraft")}
                      </p>
                      <img
                        src={program.coverImage}
                        alt={t("coverImageUpload.currentDraftAlt")}
                        className="mt-3 h-32 w-full rounded-2xl object-cover"
                      />
                      {program.draftSnapshot.coverImageAsset ? (
                        <p className="mt-3 text-xs text-slate-500">
                          {program.draftSnapshot.coverImageAsset.fileName}
                          {formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)
                            ? ` · ${formatFileSize(program.draftSnapshot.coverImageAsset.sizeBytes)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    {program.publishedSnapshot?.coverImage ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {t("coverImageUpload.currentPublished")}
                        </p>
                        <img
                          src={program.publishedSnapshot.coverImage}
                          alt={t("coverImageUpload.currentPublishedAlt")}
                          className="mt-3 h-32 w-full rounded-2xl object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <label className="surface-dark-panel flex items-center gap-3 rounded-2xl p-4 text-sm text-slate-200 md:col-span-2">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={program?.featured ?? false}
                  className="h-4 w-4 rounded border-white/20 bg-slate-950 text-teal-400"
                />
                <span>{t("fields.featuredToggle")}</span>
              </label>
            </div>
          </article>

          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.localizedPresentation")}</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {locales.map((locale) => (
                <div key={locale} className="surface-dark-panel rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t("translationLocale", { locale: locale.toUpperCase() })}
                  </p>
                  <div className="mt-4 space-y-4 text-sm text-slate-200">
                    <label className="block">
                      <span className="font-semibold text-white">{t("fields.title")}</span>
                      <input
                        name={`translations.${locale}.title`}
                        defaultValue={program?.translations[locale].title ?? ""}
                        placeholder={getFieldValue(program, t("placeholders.programTitle"))}
                        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </label>
                    <label className="block">
                      <span className="font-semibold text-white">{t("fields.shortDescription")}</span>
                      <textarea
                        name={`translations.${locale}.shortDescription`}
                        defaultValue={program?.translations[locale].shortDescription ?? ""}
                        placeholder={getFieldValue(program, t("placeholders.shortDescription"))}
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </label>
                    <label className="block">
                      <span className="font-semibold text-white">{t("fields.fullDescription")}</span>
                      <textarea
                        name={`translations.${locale}.fullDescription`}
                        defaultValue={program?.translations[locale].fullDescription ?? ""}
                        placeholder={getFieldValue(program, t("placeholders.fullDescription"))}
                        rows={6}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.operationalDetails")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                <label key={field.label} className="surface-dark-panel rounded-2xl p-4 text-sm text-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {field.label}
                  </span>
                  <input
                    name={`${field.key}.${activeLocale}`}
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                  />
                </label>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.workflow")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t("workflow.description")}</p>
            <div className="mt-5 space-y-3">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
              >
                {isEdit ? t("actions.update") : t("actions.saveDraft")}
              </button>
              <button
                type="submit"
                formAction={publishAction}
                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
              >
                {t("actions.publish")}
              </button>
              <Link
                href="/admin/programs"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("actions.backToOverview")}
              </Link>
            </div>

            {isEdit && archiveAction && reactivateAction ? (
              <div className="mt-5 border-t border-white/10 pt-5">
                {program?.status === "archived" ? (
                  <button
                    type="submit"
                    formAction={reactivateAction}
                    className="inline-flex w-full items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20"
                  >
                    {t("actions.reactivate")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    formAction={archiveAction}
                    className="inline-flex w-full items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                  >
                    {t("actions.archive")}
                  </button>
                )}
              </div>
            ) : null}
          </article>

          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.boundaries")}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {[t("boundaries.0"), t("boundaries.1"), t("boundaries.2")].map((item) => (
                <li key={item} className="surface-dark-panel-muted rounded-2xl px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.requirements")}</h2>
            <label className="mt-4 block text-sm text-slate-300">
              <span className="sr-only">{t("sections.requirements")}</span>
              <textarea
                name={`translations.${activeLocale}.requirements`}
                defaultValue={getLines(program?.translations[activeLocale].requirements)}
                placeholder={t("placeholders.requirementsLines")}
                rows={6}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              />
            </label>
          </article>

          <article className="surface-dark-soft rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.included")}</h2>
            <label className="mt-4 block text-sm text-slate-300">
              <span className="sr-only">{t("sections.included")}</span>
              <textarea
                name={`translations.${activeLocale}.included`}
                defaultValue={getLines(program?.translations[activeLocale].included)}
                placeholder={t("placeholders.includedLines")}
                rows={6}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              />
            </label>
          </article>

          <article className="surface-dark-soft rounded-3xl p-6 text-sm leading-7 text-slate-300">
            <h2 className="text-lg font-semibold text-white">{t("sections.seoAuditPreview")}</h2>
            <p className="mt-4">{t("seoAuditDescription")}</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm text-slate-300">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("fields.seoTitle")}
                </span>
                <input
                  name={`seo.${activeLocale}.title`}
                  defaultValue={program?.seo[activeLocale].title ?? ""}
                  placeholder={t("placeholders.seoTitle")}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
              <label className="block text-sm text-slate-300">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("fields.seoDescription")}
                </span>
                <textarea
                  name={`seo.${activeLocale}.description`}
                  defaultValue={program?.seo[activeLocale].description ?? ""}
                  placeholder={t("placeholders.seoDescription")}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
            </div>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <p>{t("audit.createdBy")}: {program?.createdBy ?? t("placeholders.pendingWorkflow")}</p>
              <p>{t("audit.updatedBy")}: {program?.updatedBy ?? t("placeholders.pendingWorkflow")}</p>
              <p>{t("audit.createdAt")}: {program?.createdAt ?? t("placeholders.autoGenerated")}</p>
              <p>{t("audit.updatedAt")}: {program?.updatedAt ?? t("placeholders.autoGenerated")}</p>
              <p>{t("audit.firstPublishedAt")}: {program?.firstPublishedAt ?? t("placeholders.notPublishedYet")}</p>
              <p>{t("audit.pendingDraft")}: {pendingDraft ? t("yes") : t("no")}</p>
            </div>
          </article>
        </aside>
      </form>
    </div>
  );
}
