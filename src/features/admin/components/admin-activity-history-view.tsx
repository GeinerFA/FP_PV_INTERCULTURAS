import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import {
  type AdminActivityTranslator,
  formatAdminActivityDateTime,
  getAdminActivityActorLabel,
  getAdminActivityDetailLines,
} from "@/features/admin/lib/admin-activity-presenter";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { Link } from "@/i18n/navigation";
import { listAdminActivityLogsForEntity } from "@/services/admin/activity-service";
import { adminActivityEntityTypes, type AdminActivityEntityType, type AdminActivityLog } from "@/types/admin-activity";

const actionTranslationKeys = {
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
} as const;

function isAdminActivityEntityType(value: string): value is AdminActivityEntityType {
  return adminActivityEntityTypes.includes(value as AdminActivityEntityType);
}

function getActionLabel(entry: AdminActivityLog, t: AdminActivityTranslator): string {
  return t(`actions.${actionTranslationKeys[entry.action]}`);
}

type AdminActivityHistoryViewProps = {
  entityType: string;
  entityId: string;
  page: number;
};

export async function AdminActivityHistoryView({ entityType, entityId, page }: AdminActivityHistoryViewProps) {
  if (!isAdminActivityEntityType(entityType)) {
    notFound();
  }

  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminActivityOverview")]);

  let entries: AdminActivityLog[];

  try {
    entries = await listAdminActivityLogsForEntity(entityType, entityId);
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

  if (entries.length === 0) {
    notFound();
  }

  const entityLabel = entries[0]?.entityLabel ?? entityId;

  return (
    <AdminWorkspaceSection
      eyebrow={t(`entityTypes.${entityType}`)}
      title={t("history.title", { target: entityLabel })}
      description={t("history.description", { count: entries.length })}
      action={
        <Link
          href={page > 1 ? { pathname: "/admin/activity", query: { page: String(page) } } : "/admin/activity"}
          className="admin-outline-action inline-flex rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          {t("history.backToFeed")}
        </Link>
      }
    >
      <ol className="space-y-4">
        {entries.map((entry) => {
          const detailLines = getAdminActivityDetailLines(entry, t);

          return (
            <li
              key={entry.id}
              className="admin-inner-panel rounded-3xl px-5 py-5"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-800 ring-1 ring-emerald-200">
                    {getActionLabel(entry, t)}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-700 ring-1 ring-slate-200">
                    {t(`entityTypes.${entry.entityType}`)}
                  </span>
                </div>

                <div className="space-y-2">
                  {detailLines.map((line, index) => (
                    <p key={`${entry.id}-${index}`} className="text-base leading-7 text-slate-900">
                      {line}
                    </p>
                  ))}
                </div>

                <div className="admin-inner-panel-subtle rounded-2xl px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("history.metadata.title")}</p>
                  <dl className="mt-3 grid gap-4 md:grid-cols-2">
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
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </AdminWorkspaceSection>
  );
}
