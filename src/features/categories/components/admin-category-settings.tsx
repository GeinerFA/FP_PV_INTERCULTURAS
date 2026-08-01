import { getLocale, getTranslations } from "next-intl/server";

import {
  createProgramCategoryAction,
  deleteProgramCategoryAction,
  updateProgramCategoryAction,
} from "@/app/[locale]/admin/settings/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { listAdminProgramCategories } from "@/services/categories/category-service";
import { programCategoryThemes } from "@/types/category";

type AdminCategorySettingsProps = {
  feedback?:
    | "created"
    | "updated"
    | "deleted"
    | "invalid"
    | "save-failed"
    | "delete-failed"
    | "delete-blocked"
    | "duplicate-code";
  selectedCategoryId?: string;
  shouldOpenCreateDisclosure?: boolean;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.134l3.71-3.904a.75.75 0 1 1 1.08 1.04l-4.25 4.472a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
    </svg>
  );
}

export async function AdminCategorySettings({
  feedback,
  selectedCategoryId,
  shouldOpenCreateDisclosure = false,
}: AdminCategorySettingsProps) {
  const [t, locale] = await Promise.all([getTranslations("AdminCategorySettings"), getLocale()]);

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

  const activeLocale = locale as AppLocale;
  const createAction = createProgramCategoryAction.bind(null, activeLocale);
  const feedbackTone =
    feedback === "invalid" ||
    feedback === "save-failed" ||
    feedback === "delete-failed" ||
    feedback === "delete-blocked" ||
    feedback === "duplicate-code"
      ? "admin-warning-banner"
      : "admin-success-banner";
  const categoriesInUseCount = categories.filter((category) => category.programCount > 0).length;

  return (
    <div id="admin-category-settings-top" className="space-y-8">
      {feedback ? (
        <div
          className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}
        >
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("stats.total.label")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{categories.length}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.total.description")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("stats.inUse.label")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{categoriesInUseCount}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.inUse.description")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("live.label")}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{t("live.description")}</p>
        </article>
      </div>

      <details className="group" open={shouldOpenCreateDisclosure}>
        <summary className="inline-flex max-w-full cursor-pointer list-none items-center gap-3 rounded-full border border-emerald-900/12 bg-white px-4 py-2.5 text-left shadow-[0_12px_30px_-24px_rgba(15,23,42,0.32)] transition hover:border-emerald-300 hover:bg-emerald-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white [&::-webkit-details-marker]:hidden">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950/[0.04] text-lg font-semibold leading-none text-slate-500 transition duration-300 ease-out group-open:rotate-45 group-open:bg-emerald-100 group-open:text-emerald-800 motion-reduce:transition-none">
            +
          </span>
          <span className="text-sm font-semibold text-slate-950">
            <span className="group-open:hidden">{t("create.disclosureClosedLabel")}</span>
            <span className="hidden group-open:inline">{t("create.disclosureOpenLabel")}</span>
          </span>
        </summary>

        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out group-open:grid-rows-[1fr] group-open:opacity-100 motion-reduce:transition-none">
          <div className="overflow-hidden">
            <AdminWorkspaceSection className="mt-4" title={t("create.title")} description={t("create.description")}>
              <form action={createAction} className="space-y-4">
                <p className="text-sm leading-7 text-slate-600">{t("create.disclosureHint")}</p>

                <label className="block space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.name")}</span>
                  <input
                    name="name"
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    placeholder={t("placeholders.name")}
                  />
                </label>
                <label className="block space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.theme")}</span>
                  <select
                    name="theme"
                    defaultValue="emerald"
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  >
                    {programCategoryThemes.map((theme) => (
                      <option key={theme} value={theme}>
                        {t(`themes.${theme}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
                >
                  {t("actions.create")}
                </button>
              </form>
            </AdminWorkspaceSection>
          </div>
        </div>
      </details>

      <AdminWorkspaceSection title={t("list.title")} description={t("list.description")}>
        {categories.length === 0 ? <p className="text-sm leading-7 text-slate-600">{t("empty")}</p> : null}

        <div className="space-y-5">
          {categories.map((category) => {
            const formId = `admin-category-entry-${category.id}`;

            return (
              <details key={category.id} className="group admin-inner-panel rounded-[28px]" open={selectedCategoryId === category.id}>
                <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 text-left transition hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:p-6 lg:flex-row lg:items-start lg:justify-between [&::-webkit-details-marker]:hidden">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-950">{category.name}</h3>
                      <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        {t(`themes.${category.theme}`)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{t("entry.code", { code: category.code })}</p>
                    <p className="text-sm text-slate-600">{t("entry.programCount", { count: category.programCount })}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span className="group-open:hidden">{t("entry.disclosureClosedLabel")}</span>
                      <span className="hidden group-open:inline">{t("entry.disclosureOpenLabel")}</span>
                    </p>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/12 bg-white text-slate-500 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.32)] transition duration-300 ease-out group-open:rotate-180 group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-emerald-800 motion-reduce:transition-none">
                      <ChevronDownIcon className="h-4 w-4" />
                    </span>
                  </div>
                </summary>

                <div className="border-t border-emerald-900/8 px-5 pb-5 pt-5 md:px-6 md:pb-6">
                  <form id={formId} action={updateProgramCategoryAction.bind(null, activeLocale, category.id)} className="space-y-4">
                    <label className="block space-y-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.name")}</span>
                      <input
                        name="name"
                        defaultValue={category.name}
                        className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                      />
                    </label>
                    <label className="block space-y-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.theme")}</span>
                      <select
                        name="theme"
                        defaultValue={category.theme}
                        className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                      >
                        {programCategoryThemes.map((theme) => (
                          <option key={theme} value={theme}>
                            {t(`themes.${theme}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <button
                        type="submit"
                        className="admin-secondary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
                      >
                        {t("actions.save")}
                      </button>
                      <DestructiveActionConfirmation
                        title={t("delete.title")}
                        description={t("delete.description")}
                        warning={category.programCount > 0 ? t("delete.blockedWarning") : t("delete.warning")}
                        triggerLabel={t("actions.delete")}
                        confirmLabel={t("delete.confirm")}
                        cancelLabel={t("delete.cancel")}
                        confirmValue="delete"
                        formAction={deleteProgramCategoryAction.bind(null, activeLocale, category.id)}
                        formId={formId}
                        tone="danger"
                        actionLayout="stacked"
                        className="w-full md:max-w-xs"
                      />
                    </div>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      </AdminWorkspaceSection>
    </div>
  );
}
