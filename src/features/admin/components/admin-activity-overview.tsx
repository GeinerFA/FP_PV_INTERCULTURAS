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
import {
  adminSettingsActivityEntityTypes,
  type AdminActivityAction,
  type AdminActivityLog,
} from "@/types/admin-activity";

const actionTranslationKeys: Record<AdminActivityAction, string> = {
  "application.status_updated": "applicationStatusUpdated",
  "faq.created": "faqCreated",
  "faq.updated": "faqUpdated",
  "faq.deleted": "faqDeleted",
  "faq.reordered": "faqReordered",
  "program_category.created": "programCategoryCreated",
  "program_category.updated": "programCategoryUpdated",
  "program_category.deleted": "programCategoryDeleted",
  "admin_user.created": "adminUserCreated",
  "admin_user.updated": "adminUserUpdated",
  "admin_user.activated": "adminUserActivated",
  "admin_user.deactivated": "adminUserDeactivated",
  "admin_user.deleted": "adminUserDeleted",
  "home_hero_video.created": "homeHeroVideoCreated",
  "home_hero_video.reordered": "homeHeroVideoReordered",
  "home_hero_video.deleted": "homeHeroVideoDeleted",
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
  "faq.created": {
    accent: "from-cyan-500 via-sky-500 to-blue-500",
    badge: "bg-cyan-50 text-cyan-900 ring-cyan-200",
    detail: "border-cyan-200/70 bg-cyan-50/80 text-cyan-950",
  },
  "faq.updated": {
    accent: "from-cyan-500 via-teal-500 to-emerald-500",
    badge: "bg-cyan-50 text-cyan-900 ring-cyan-200",
    detail: "border-cyan-200/70 bg-cyan-50/80 text-cyan-950",
  },
  "faq.deleted": {
    accent: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
    detail: "border-rose-200/70 bg-rose-50/80 text-rose-950",
  },
  "faq.reordered": {
    accent: "from-indigo-500 via-sky-500 to-cyan-500",
    badge: "bg-indigo-50 text-indigo-900 ring-indigo-200",
    detail: "border-indigo-200/70 bg-indigo-50/80 text-indigo-950",
  },
  "program_category.created": {
    accent: "from-emerald-500 via-lime-500 to-teal-500",
    badge: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    detail: "border-emerald-200/70 bg-emerald-50/80 text-emerald-950",
  },
  "program_category.updated": {
    accent: "from-amber-500 via-yellow-500 to-emerald-500",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    detail: "border-amber-200/70 bg-amber-50/80 text-amber-950",
  },
  "program_category.deleted": {
    accent: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
    detail: "border-rose-200/70 bg-rose-50/80 text-rose-950",
  },
  "admin_user.created": {
    accent: "from-violet-500 via-fuchsia-500 to-sky-500",
    badge: "bg-violet-50 text-violet-900 ring-violet-200",
    detail: "border-violet-200/70 bg-violet-50/80 text-violet-950",
  },
  "admin_user.updated": {
    accent: "from-violet-500 via-fuchsia-500 to-emerald-500",
    badge: "bg-violet-50 text-violet-900 ring-violet-200",
    detail: "border-violet-200/70 bg-violet-50/80 text-violet-950",
  },
  "admin_user.activated": {
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    badge: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    detail: "border-emerald-200/70 bg-emerald-50/80 text-emerald-950",
  },
  "admin_user.deactivated": {
    accent: "from-amber-500 via-orange-500 to-rose-500",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    detail: "border-amber-200/70 bg-amber-50/80 text-amber-950",
  },
  "admin_user.deleted": {
    accent: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
    detail: "border-rose-200/70 bg-rose-50/80 text-rose-950",
  },
  "home_hero_video.created": {
    accent: "from-sky-500 via-indigo-500 to-violet-500",
    badge: "bg-sky-50 text-sky-900 ring-sky-200",
    detail: "border-sky-200/70 bg-sky-50/80 text-sky-950",
  },
  "home_hero_video.reordered": {
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
    badge: "bg-indigo-50 text-indigo-900 ring-indigo-200",
    detail: "border-indigo-200/70 bg-indigo-50/80 text-indigo-950",
  },
  "home_hero_video.deleted": {
    accent: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
    detail: "border-rose-200/70 bg-rose-50/80 text-rose-950",
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
  const settingsEvents = adminSettingsActivityEntityTypes.reduce((total, entityType) => total + entityCounts[entityType], 0);
  const latestEvent = currentPage === 1 ? (entries[0] ?? null) : null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { key: "total", value: totalCount },
          { key: "applications", value: applicationEvents },
          { key: "programs", value: programEvents },
          { key: "settings", value: settingsEvents },
        ].map((item) => (
          <article key={item.key} className="admin-inner-panel rounded-3xl p-6">
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
            <div className="admin-inner-panel-subtle rounded-2xl px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("feed.latestLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatAdminActivityDateTime(latestEvent.happenedAt, locale)}
              </p>
            </div>
          ) : null
        }
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
                  className="admin-inner-panel group relative overflow-hidden rounded-[1.75rem] px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.42)]"
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
                        </div>
                      </div>

                      {detailLines.length > 0 ? (
                          <div className={`rounded-2xl border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${actionTheme.detail}`}>
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

                    <div className="admin-inner-panel-subtle flex flex-col gap-4 rounded-[1.35rem] px-4 py-4">
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
