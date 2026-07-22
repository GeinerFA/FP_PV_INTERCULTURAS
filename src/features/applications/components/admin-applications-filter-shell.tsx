"use client";

import type { FormEvent, ReactNode } from "react";
import { useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";
import { applicationStatuses, applicationTypeCodes, type ApplicationStatus } from "@/types/application";

type AdminApplicationsFilterShellCopy = {
  heading: string;
  description: string;
  disclosureClosedLabel: string;
  disclosureOpenLabel: string;
  disclosureHint: string;
  searchLabel: string;
  searchPlaceholder: string;
  statusLabel: string;
  applicationTypeLabel: string;
  fromLabel: string;
  toLabel: string;
  allStatuses: string;
  allApplicationTypes: string;
  applyLabel: string;
  applyingLabel: string;
  resetLabel: string;
  activeBadge: string;
  activeSummary: string;
  resultsSummary: string;
  updatingResultsLabel: string;
  statuses: Record<ApplicationStatus, string>;
  applicationTypes: Record<(typeof applicationTypeCodes)[number], string>;
};

type AdminApplicationsFilterShellProps = {
  copy: AdminApplicationsFilterShellCopy;
  defaultValues: {
    query: string;
    status: string;
    applicationType: string;
    from: string;
    to: string;
  };
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  children: ReactNode;
};

function buildSearchParams(formData: FormData) {
  const params = new URLSearchParams();

  for (const key of ["q", "status", "type", "from", "to"] as const) {
    const rawValue = formData.get(key);
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (value.length > 0) {
      params.set(key, value);
    }
  }

  return params;
}

export function AdminApplicationsFilterShell({
  copy,
  defaultValues,
  hasActiveFilters,
  activeFiltersCount,
  children,
}: AdminApplicationsFilterShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isFilteredView = searchParams.toString().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = buildSearchParams(new FormData(event.currentTarget));

    startTransition(() => {
      router.push({
        pathname: "/admin/applications",
        query: Object.fromEntries(params),
      });
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push("/admin/applications");
    });
  };

  return (
    <div className="px-6 pb-6">
      <details className="group" open={hasActiveFilters || isPending}>
        <summary className="inline-flex max-w-full cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-900/12 bg-white px-4 py-2.5 text-left shadow-[0_12px_30px_-24px_rgba(15,23,42,0.32)] transition hover:border-emerald-300 hover:bg-emerald-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold text-slate-950">
            <span className="group-open:hidden">{copy.disclosureClosedLabel}</span>
            <span className="hidden group-open:inline">{copy.disclosureOpenLabel}</span>
          </span>
          {hasActiveFilters ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {activeFiltersCount}
            </span>
          ) : null}
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950/[0.04] text-slate-500 transition duration-300 ease-out group-open:rotate-180 group-open:bg-emerald-100 group-open:text-emerald-800 motion-reduce:transition-none">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.134l3.71-3.904a.75.75 0 1 1 1.08 1.04l-4.25 4.472a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </span>
        </summary>

        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out group-open:grid-rows-[1fr] group-open:opacity-100 motion-reduce:transition-none">
          <div className="overflow-hidden">
            <div className="mt-4 rounded-[28px] border border-emerald-900/10 bg-white/88 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.24)]">
              <div className="border-b border-emerald-900/8 px-5 py-4">
                <div className="max-w-3xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{copy.heading}</p>
                    {hasActiveFilters ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                        {copy.activeBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {hasActiveFilters ? copy.activeSummary : copy.disclosureHint}
                  </p>
                  <p className="text-sm leading-7 text-slate-600">{copy.description}</p>
                </div>
              </div>

              <div className="px-5 py-5">
                <form method="get" onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.7fr))]">
                  <label className="block text-sm text-slate-700 xl:col-span-1">
                    <span className="block text-sm font-semibold text-slate-950">{copy.searchLabel}</span>
                    <input
                      type="search"
                      name="q"
                      defaultValue={defaultValues.query}
                      placeholder={copy.searchPlaceholder}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>

                  <label className="block text-sm text-slate-700">
                    <span className="block text-sm font-semibold text-slate-950">{copy.statusLabel}</span>
                    <select
                      name="status"
                      defaultValue={defaultValues.status}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    >
                      <option value="">{copy.allStatuses}</option>
                      {applicationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {copy.statuses[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-slate-700">
                    <span className="block text-sm font-semibold text-slate-950">{copy.applicationTypeLabel}</span>
                    <select
                      name="type"
                      defaultValue={defaultValues.applicationType}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    >
                      <option value="">{copy.allApplicationTypes}</option>
                      {applicationTypeCodes.map((typeCode) => (
                        <option key={typeCode} value={typeCode}>
                          {copy.applicationTypes[typeCode]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-slate-700">
                    <span className="block text-sm font-semibold text-slate-950">{copy.fromLabel}</span>
                    <input
                      type="date"
                      name="from"
                      defaultValue={defaultValues.from}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>

                  <label className="block text-sm text-slate-700">
                    <span className="block text-sm font-semibold text-slate-950">{copy.toLabel}</span>
                    <input
                      type="date"
                      name="to"
                      defaultValue={defaultValues.to}
                      className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                    />
                  </label>

                  <div className="flex flex-wrap items-end gap-3 xl:col-span-full">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="admin-primary-action inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-progress disabled:opacity-90 motion-reduce:transition-none"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${
                          isPending ? "scale-100 opacity-100 motion-safe:animate-pulse" : "scale-75 opacity-0"
                        }`}
                      />
                      <span>{isPending ? copy.applyingLabel : copy.applyLabel}</span>
                    </button>

                    {isFilteredView ? (
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isPending}
                        className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                      >
                        {copy.resetLabel}
                      </button>
                    ) : null}

                    <p className="text-sm leading-6 text-slate-600">
                      {copy.resultsSummary}
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </details>

      <div className="sr-only" aria-live="polite">
        {isPending ? copy.updatingResultsLabel : copy.resultsSummary}
      </div>

      <div
        aria-busy={isPending}
        className={`relative mt-6 transition duration-300 ease-out motion-reduce:transition-none ${
          isPending ? "motion-safe:translate-y-1 motion-safe:scale-[0.995] opacity-75" : "translate-y-0 scale-100 opacity-100"
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent transition-opacity duration-300 motion-reduce:transition-none ${
            isPending ? "opacity-100 motion-safe:animate-pulse" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-10 rounded-[28px] bg-white/45 backdrop-blur-[1px] transition duration-300 motion-reduce:transition-none ${
            isPending ? "opacity-100" : "opacity-0"
          }`}
        />
        {children}
      </div>
    </div>
  );
}
