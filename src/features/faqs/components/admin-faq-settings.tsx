import { getLocale, getTranslations } from "next-intl/server";

import { createFaqAction, deleteFaqAction, moveFaqAction, updateFaqAction } from "@/app/[locale]/admin/settings/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";
import { listAdminFaqEntries } from "@/services/faqs/faq-service";

type AdminFaqSettingsProps = {
  feedback?: "created" | "updated" | "deleted" | "reordered" | "invalid" | "save-failed" | "delete-failed" | "reorder-failed";
  selectedFaqId?: string;
  session: AdminSession;
  shouldOpenCreateDisclosure?: boolean;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.134l3.71-3.904a.75.75 0 1 1 1.08 1.04l-4.25 4.472a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M10.53 4.22a.75.75 0 0 0-1.06 0L5.22 8.47a.75.75 0 1 0 1.06 1.06L9.25 6.56V15a.75.75 0 0 0 1.5 0V6.56l2.97 2.97a.75.75 0 1 0 1.06-1.06l-4.25-4.25Z" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M10.53 15.78a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 1.06-1.06l2.97 2.97V5a.75.75 0 0 1 1.5 0v8.44l2.97-2.97a.75.75 0 0 1 1.06 1.06l-4.25 4.25Z" />
    </svg>
  );
}

export async function AdminFaqSettings({ feedback, selectedFaqId, session, shouldOpenCreateDisclosure = false }: AdminFaqSettingsProps) {
  const [t, locale] = await Promise.all([getTranslations("AdminFaqSettings"), getLocale()]);

  let faqs: Awaited<ReturnType<typeof listAdminFaqEntries>>;

  try {
    faqs = await listAdminFaqEntries();
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
  const canManage = hasAdminPermission(session, "settings.manage");
  const canDelete = hasAdminPermission(session, "settings.delete");
  const createAction = createFaqAction.bind(null, activeLocale);
  const feedbackTone =
    feedback === "invalid" || feedback === "save-failed" || feedback === "delete-failed" || feedback === "reorder-failed"
      ? "admin-warning-banner"
      : "admin-success-banner";

  return (
    <div id="admin-faq-settings-top" className="space-y-8">
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
          <p className="mt-3 text-3xl font-semibold text-slate-950">{faqs.length}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.total.description")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("live.label")}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{t("live.description")}</p>
        </article>
      </div>

      {canManage ? <details className="group" open={shouldOpenCreateDisclosure}>
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
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.question")}</span>
                  <input
                    name="question"
                    className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    placeholder={t("placeholders.question")}
                  />
                </label>
                <label className="block space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.answer")}</span>
                  <textarea
                    name="answer"
                    rows={5}
                    className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    placeholder={t("placeholders.answer")}
                  />
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
      </details> : null}

      <AdminWorkspaceSection title={t("list.title")} description={t("list.description")}>
        {faqs.length === 0 ? <p className="text-sm leading-7 text-slate-600">{t("empty")}</p> : null}

        <div className="space-y-5">
          {faqs.map((faq, index) => {
            const formId = `admin-faq-entry-${faq.id}`;

            return (
              <details key={faq.id} className="group admin-inner-panel rounded-[28px]" open={selectedFaqId === faq.id}>
                <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 text-left transition hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:p-6 lg:flex-row lg:items-start lg:justify-between [&::-webkit-details-marker]:hidden">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("entry.position", { order: faq.order })}</p>
                    <h3 className="text-lg font-semibold text-slate-950 md:text-xl">{faq.question}</h3>
                    <p className="text-sm leading-7 text-slate-600">{t("entry.helper")}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                    <span aria-hidden="true" className="hidden h-4 lg:block" />
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/12 bg-white text-slate-500 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.32)] transition duration-300 ease-out group-open:rotate-180 group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-emerald-800 motion-reduce:transition-none">
                      <ChevronDownIcon className="h-4 w-4" />
                    </span>
                  </div>
                </summary>

                 <div className="border-t border-emerald-900/8 px-5 pb-5 pt-5 md:px-6 md:pb-6">
                   {canManage ? (
                     <>
                       <div className="mb-4 flex flex-wrap justify-end gap-2">
                         <form action={moveFaqAction.bind(null, activeLocale, faq.id)}>
                           <input type="hidden" name="direction" value="up" />
                           <button
                             type="submit"
                             disabled={index === 0}
                             aria-label={t("actions.moveUp")}
                             className="admin-outline-action inline-flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
                           >
                             <ArrowUpIcon className="h-4 w-4" />
                           </button>
                         </form>
                         <form action={moveFaqAction.bind(null, activeLocale, faq.id)}>
                           <input type="hidden" name="direction" value="down" />
                           <button
                             type="submit"
                             disabled={index === faqs.length - 1}
                             aria-label={t("actions.moveDown")}
                             className="admin-outline-action inline-flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
                           >
                             <ArrowDownIcon className="h-4 w-4" />
                           </button>
                         </form>
                       </div>

                       <form id={formId} action={updateFaqAction.bind(null, activeLocale, faq.id)} className="space-y-4">
                         <label className="block space-y-2.5">
                           <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.question")}</span>
                           <input
                             name="question"
                             defaultValue={faq.question}
                             className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                           />
                         </label>
                         <label className="block space-y-2.5">
                           <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.answer")}</span>
                           <textarea
                             name="answer"
                             defaultValue={faq.answer}
                             rows={5}
                             className="admin-inner-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                           />
                         </label>
                         <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                           <button
                             type="submit"
                             className="admin-secondary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
                           >
                             {t("actions.save")}
                           </button>
                           {canDelete ? (
                             <DestructiveActionConfirmation
                               title={t("delete.title")}
                               description={t("delete.description")}
                               warning={t("delete.warning")}
                               triggerLabel={t("actions.delete")}
                               confirmLabel={t("delete.confirm")}
                               cancelLabel={t("delete.cancel")}
                               confirmValue="delete"
                               formAction={deleteFaqAction.bind(null, activeLocale, faq.id)}
                               formId={formId}
                               tone="danger"
                               actionLayout="stacked"
                               className="w-full md:max-w-xs"
                             />
                           ) : null}
                         </div>
                       </form>
                     </>
                   ) : (
                     <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{faq.answer}</p>
                   )}
                 </div>
              </details>
            );
          })}
        </div>
      </AdminWorkspaceSection>
    </div>
  );
}
