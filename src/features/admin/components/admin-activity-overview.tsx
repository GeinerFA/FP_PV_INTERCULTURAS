import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import {
  type AdminActivityTranslator,
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
              <p className="mt-2 text-sm font-medium text-slate-800">
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

              return (
                <article
                  key={entry.id}
                  className="surface-dark-panel-muted rounded-3xl border border-emerald-900/8 px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-800 ring-1 ring-emerald-200">
                          {getActionLabel(entry, t)}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-700 ring-1 ring-slate-200">
                          {t(`entityTypes.${entry.entityType}`)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-base font-semibold leading-7 text-slate-950">
                          {getAdminActivityFeedSummary(entry, t)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                          <span>{formatAdminActivityDateTime(entry.happenedAt, locale)}</span>
                          <span>{getAdminActivityActorLabel(entry, t)}</span>
                          {entry.metadata?.slug ? <span>/{entry.metadata.slug}</span> : null}
                        </div>
                      </div>
                    </div>

                    {entryHref ? (
                      <Link
                        href={entryHref}
                        className="admin-outline-action inline-flex rounded-full px-4 py-2 text-sm font-semibold transition lg:shrink-0"
                      >
                        {t("feed.openRecord")}
                      </Link>
                    ) : null}
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
