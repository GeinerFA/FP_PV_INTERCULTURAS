import { getLocale, getTranslations } from "next-intl/server";

import { applicationStatuses, type Application } from "@/types/application";

type AdminApplicationDetailProps = {
  application: Application;
  updateAction: (formData: FormData) => Promise<void>;
  feedback?: "updated" | "invalid" | "no-change" | "failed";
};

const statusTheme = {
  pending: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  in_process: "bg-violet-500/10 text-violet-200 ring-violet-500/30",
  resolved: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-200 ring-rose-500/30",
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
    { key: "residenceCountry", value: formatOptionalText(application.residenceCountry) },
    { key: "residenceCity", value: formatOptionalText(application.residenceCity) },
    { key: "birthDate", value: application.birthDate ? formatDateOnly(application.birthDate, locale) : "—" },
    { key: "identityDocument", value: formatOptionalText(application.identityDocument) },
    { key: "availability", value: formatOptionalText(application.availability) },
  ] as const;

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${feedback === "updated" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-amber-400/30 bg-amber-500/10 text-amber-100"}`}
        >
          {feedback === "updated" ? t("feedback.updated") : t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("applicantLabel")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{application.fullName}</h2>
              <p className="mt-2 text-sm text-slate-400">{t("submittedAt", { value: formatDate(application.createdAt, locale) })}</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[application.status]}`}
            >
              {t(`statuses.${application.status}`)}
            </span>
          </div>

          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t(`fields.${field.key}`)}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-200">{field.value}</dd>
              </div>
            ))}
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("fields.message")}
              </dt>
              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                 {formatOptionalText(application.message)}
               </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("statusCard.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t("statusCard.description")}</p>

            <form action={updateAction} className="mt-6 space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-white">
                  {t("statusCard.selectLabel")}
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={application.status}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
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
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("history.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t("history.description")}</p>

            <ol className="mt-6 space-y-4">
               {history.map((entry, index) => (
                 <li key={`${entry.changedAt}-${entry.to}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                   <div className="flex flex-wrap items-center justify-between gap-3">
                     <span
                       className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[entry.to]}`}
                     >
                       {t(`statuses.${entry.to}`)}
                     </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {formatDate(entry.changedAt, locale)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                     {t("history.changedBy", { actor: formatChangedBy(entry.changedBy) })}
                   </p>
                 </li>
               ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
