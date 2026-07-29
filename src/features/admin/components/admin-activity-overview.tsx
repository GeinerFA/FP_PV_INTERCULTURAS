import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import {
  type AdminActivityTranslator,
  getAdminActivityDetailLines,
  formatAdminActivityDateTime,
  getAdminActivityActorLabel,
  getAdminActivityFeedSummary,
} from "@/features/admin/lib/admin-activity-presenter";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { ADMIN_LIST_PAGE_SIZE } from "@/features/admin/lib/pagination";
import { Link } from "@/i18n/navigation";
import { listAdminActivityLogs } from "@/services/admin/activity-service";
import type { AdminActivityAction, AdminActivityLog } from "@/types/admin-activity";

const actionTranslationKeys: Record<AdminActivityAction, string> = {
  "application.status_updated": "applicationStatusUpdated",
  "program.created": "programCreated",
  "program.updated": "programUpdated",
  "program.published": "programPublished",
  "program.archived": "programArchived",
  "program.deleted": "programDeleted",
  "program.reactivated": "programReactivated",
};

const actionThemeClassNames: Record<
  AdminActivityAction,
  {
    accent: string;
    badge: string;
    detail: string;
  }
> = {
  "application.status_updated": {
    accent: "from-sky-500 via-cyan-500 to-teal-500",
    badge: "bg-sky-50 text-sky-900 ring-sky-200",
    detail: "border-sky-200/70 bg-sky-50/80 text-sky-950",
  },
  "program.created": {
    accent: "from-emerald-500 via-green-500 to-teal-500",
    badge: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    detail: "border-emerald-200/70 bg-emerald-50/80 text-emerald-950",
  },
  "program.updated": {
    accent: "from-amber-500 via-orange-500 to-emerald-500",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    detail: "border-amber-200/70 bg-amber-50/80 text-amber-950",
  },
  "program.published": {
    accent: "from-teal-500 via-emerald-500 to-green-500",
    badge: "bg-teal-50 text-teal-900 ring-teal-200",
    detail: "border-teal-200/70 bg-teal-50/80 text-teal-950",
  },
  "program.archived": {
    accent: "from-amber-500 via-yellow-500 to-orange-500",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    detail: "border-amber-200/70 bg-amber-50/80 text-amber-950",
  },
  "program.deleted": {
    accent: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
    detail: "border-rose-200/70 bg-rose-50/80 text-rose-950",
  },
  "program.reactivated": {
    accent: "from-violet-500 via-fuchsia-500 to-emerald-500",
    badge: "bg-violet-50 text-violet-900 ring-violet-200",
    detail: "border-violet-200/70 bg-violet-50/80 text-violet-950",
  },
};

function getEntryHref(entry: AdminActivityLog, page: number): ComponentProps<typeof Link>["href"] | null {
  if (entry.action === "program.deleted") {
    return null;
  }

  return {
    pathname: "/admin/activity/[entityType]/[entityId]",
    params: { entityId: entry.entityId, entityType: entry.entityType },
    query: page > 1 ? { page: String(page) } : undefined,
  };
}

function getActionLabel(entry: AdminActivityLog, t: AdminActivityTranslator): string {
  return t(`actions.${actionTranslationKeys[entry.action]}`);
}

type AdminActivityOverviewProps = {
  page: number;
};

export async function AdminActivityOverview({ page }: AdminActivityOverviewProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminActivityOverview")]);

  let activity: Awaited<ReturnType<typeof listAdminActivityLogs>>;

  try {
    activity = await listAdminActivityLogs({ page, pageSize: ADMIN_LIST_PAGE_SIZE, includeEntityCounts: true });
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

  const { currentPage, entries, entityCounts, totalCount, totalPages } = activity;
  const applicationEvents = entityCounts.application;
  const programEvents = entityCounts.program;
  const latestEvent = currentPage === 1 ? (entries[0] ?? null) : null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-3">
        {[
          { key: "total", value: totalCount },
          { key: "applications", value: applicationEvents },
          { key: "programs", value: programEvents },
        ].map((item) => (
          <article key={item.key} className="surface-dark-soft rounded-3xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t(`stats.${item.key}.label`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t(`stats.${item.key}.description`)}</p>
          </article>
        ))}
      </div>

      <AdminWorkspaceSection
        eyebrow={t("feed.eyebrow")}
        title={t("feed.title")}
        description={t("feed.description")}
        action={
          latestEvent ? (
            <div className="rounded-2xl border border-emerald-900/10 bg-white/70 px-4 py-3 text-right shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("feed.latestLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatAdminActivityDateTime(latestEvent.happenedAt, locale)}
              </p>
            </div>
          ) : null
        }
        className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,232,0.84))] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.14)]"
      >
        {entries.length === 0 ? (
          <div className="surface-dark-panel-muted rounded-2xl px-5 py-5 text-sm leading-7 text-slate-700">
            {t("feed.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const entryHref = getEntryHref(entry, currentPage);
              const detailLines = getAdminActivityDetailLines(entry, t);
              const actionTheme = actionThemeClassNames[entry.action];

              return (
                <article
                  key={entry.id}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/88 px-5 py-5 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.38)] ring-1 ring-white/70 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.42)]"
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${actionTheme.accent}`} />
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.9fr)]">
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ring-1 ${actionTheme.badge}`}>
                          {getActionLabel(entry, t)}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-800 ring-1 ring-slate-200">
                          {t(`entityTypes.${entry.entityType}`)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="min-w-0 space-y-2">
                          <p className="text-base font-semibold leading-7 text-slate-950 xl:text-[1.05rem]">
                            {getAdminActivityFeedSummary(entry, t)}
                          </p>
                          {entry.metadata?.slug ? (
                            <p className="break-all text-sm font-medium text-slate-600">/{entry.metadata.slug}</p>
                          ) : null}
                        </div>
                      </div>

                      {detailLines.length > 0 ? (
                        <div className={`rounded-2xl border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${actionTheme.detail}`}>
                          <div className="space-y-2">
                            {detailLines.map((line, index) => (
                              <p key={`${entry.id}-detail-${index}`} className="text-sm leading-7 text-slate-700">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-4 rounded-[1.35rem] border border-slate-200/85 bg-slate-50/88 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                      <dl className="grid gap-4">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {t("history.metadata.actorLabel")}
                          </dt>
                          <dd className="mt-2 text-sm font-medium text-slate-900">{getAdminActivityActorLabel(entry, t)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {t("history.metadata.dateTimeLabel")}
                          </dt>
                          <dd className="mt-2 text-sm font-medium text-slate-900">
                            {formatAdminActivityDateTime(entry.happenedAt, locale)}
                          </dd>
                        </div>
                      </dl>

                      {entryHref ? (
                        <Link
                          href={entryHref}
                          className="mt-auto inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.45)] transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          {t("feed.openRecord")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <AdminPagination
          pathname="/admin/activity"
          currentPage={currentPage}
          totalPages={totalPages}
          copy={{
            previousLabel: t("pagination.previousLabel"),
            nextLabel: t("pagination.nextLabel"),
            pageSummary: t("pagination.pageSummary", {
              page: currentPage,
              totalPages,
            }),
            rangeSummary: t("pagination.rangeSummary", {
              from: totalCount === 0 ? 0 : (currentPage - 1) * ADMIN_LIST_PAGE_SIZE + 1,
              to: Math.min(currentPage * ADMIN_LIST_PAGE_SIZE, totalCount),
              total: totalCount,
            }),
          }}
        />
      </AdminWorkspaceSection>
    </div>
  );
}
