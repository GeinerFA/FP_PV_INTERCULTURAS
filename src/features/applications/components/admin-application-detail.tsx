import { getLocale, getTranslations } from "next-intl/server";

import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { applicationStatuses, type Application } from "@/types/application";

type AdminApplicationDetailProps = {
  application: Application;
  updateAction: (formData: FormData) => Promise<void>;
  feedback?: "updated" | "invalid" | "no-change" | "failed";
};

const statusTheme = {
  pending: "bg-amber-500/12 text-amber-100 ring-amber-400/30",
  in_process: "bg-violet-500/12 text-violet-100 ring-violet-400/30",
  resolved: "bg-emerald-500/12 text-emerald-100 ring-emerald-400/30",
  cancelled: "bg-rose-500/12 text-rose-100 ring-rose-400/30",
} as const;

function formatOptionalText(value: string | null): string {
  return value ?? "—";
}

function formatChangedBy(actor: Application["statusHistory"][number]["changedBy"]): string {
  if (!actor) {
    return "system";
  }

  return actor.email ?? actor.role ?? actor.userId ?? "system";
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function AdminApplicationDetail({
  application,
  updateAction,
  feedback,
}: AdminApplicationDetailProps) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("ApplicationFlow.admin.detail"),
  ]);
  const history = [...application.statusHistory].reverse();
  const fields = [
    { key: "email", value: application.email },
    { key: "phone", value: application.phone },
    { key: "nationality", value: application.nationality },
    { key: "birthDate", value: application.birthDate ? formatDateOnly(application.birthDate, locale) : "—" },
    { key: "availability", value: formatOptionalText(application.availability) },
  ] as const;

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-[28px] border px-4 py-3 text-sm shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)] backdrop-blur ${feedback === "updated" ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100" : "border-amber-400/30 bg-amber-500/12 text-amber-100"}`}
        >
          {feedback === "updated" ? t("feedback.updated") : t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <AdminWorkspaceSection
          eyebrow={t("applicantLabel")}
          title={application.fullName}
          description={t("submittedAt", { value: formatDate(application.createdAt, locale) })}
          action={
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[application.status]}`}
            >
              {t(`statuses.${application.status}`)}
            </span>
          }
        >
          <dl className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
                <div key={field.key}>
                 <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                   {t(`fields.${field.key}`)}
                 </dt>
                 <dd className="mt-2 text-sm leading-6 text-slate-200">{field.value}</dd>
                </div>
             ))}
             <div className="md:col-span-2">
               <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                 {t("fields.message")}
               </dt>
               <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                 {formatOptionalText(application.message)}
               </dd>
             </div>
             <div className="md:col-span-2">
               <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                 {t("fields.curriculum")}
               </dt>
               <dd className="mt-2 text-sm leading-6 text-slate-200">
                 {application.curriculum ? (
                   <div className="flex flex-col gap-3">
                    <p>
                      {application.curriculum.fileName} · {formatFileSize(application.curriculum.sizeBytes)}
                    </p>
                    <a
                      href={`/${locale}/admin/applications/${application.id}/curriculum`}
                        className="inline-flex w-fit rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-teal-300 hover:text-teal-200"
                      >
                      {t("curriculum.downloadLabel")}
                    </a>
                  </div>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </AdminWorkspaceSection>

        <div className="space-y-6">
          <AdminWorkspaceSection title={t("statusCard.title")} description={t("statusCard.description")}>
            <form action={updateAction} className="space-y-4">
              <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-slate-50">
                    {t("statusCard.selectLabel")}
                  </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={application.status}
                  className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                >
                  {applicationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
              >
                {t("statusCard.submitLabel")}
              </button>
            </form>
          </AdminWorkspaceSection>

          <AdminWorkspaceSection title={t("history.title")} description={t("history.description")} tone="subtle">
            <ol className="space-y-4">
              {history.map((entry, index) => (
                <li key={`${entry.changedAt}-${entry.to}-${index}`} className="admin-inner-panel-subtle rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[entry.to]}`}
                    >
                      {t(`statuses.${entry.to}`)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {formatDate(entry.changedAt, locale)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">
                    {t("history.changedBy", { actor: formatChangedBy(entry.changedBy) })}
                  </p>
                </li>
              ))}
            </ol>
          </AdminWorkspaceSection>
        </div>
      </div>
    </div>
  );
}
