import { resolveAdminActorDisplayName } from "@/features/admin/lib/admin-actor-label";
import type { AdminActivityLog, AdminProgramActivityChange } from "@/types/admin-activity";
import type { AdminRole } from "@/types/admin-user";

type TranslationValues = Record<string, string | number | Date>;

export type AdminActivityTranslator = (key: string, values?: TranslationValues) => string;

export function formatAdminActivityDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminActivityActorLabel(entry: AdminActivityLog, t: AdminActivityTranslator): string {
  return resolveAdminActorDisplayName(entry.actor) ?? t("feed.systemActor");
}

function humanizeTokenizedValue(value: string): string {
  return value
    .split(/[._-]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function formatProgramChangeValue(change: AdminProgramActivityChange, t: AdminActivityTranslator): string {
  const value = change.to;

  if (value === null || value === undefined || value.length === 0) {
    return t("feed.noValue");
  }

  if (change.field === "featured") {
    return value === "true" ? t("feed.boolean.true") : t("feed.boolean.false");
  }

  if (change.field === "category") {
    return humanizeTokenizedValue(value);
  }

  return value;
}

function formatProgramChangeFromValue(change: AdminProgramActivityChange, t: AdminActivityTranslator): string {
  if (change.from === null || change.from === undefined || change.from.length === 0) {
    return t("feed.noValue");
  }

  if (change.field === "featured") {
    return change.from === "true" ? t("feed.boolean.true") : t("feed.boolean.false");
  }

  if (change.field === "category") {
    return humanizeTokenizedValue(change.from);
  }

  return change.from;
}

function formatProgramChangeDetail(
  target: string,
  change: AdminProgramActivityChange,
  t: AdminActivityTranslator,
): string {
  if (change.field === "featured") {
    return t(change.to === "true" ? "history.detail.programFeaturedEnabled" : "history.detail.programFeaturedDisabled", {
      target,
    });
  }

  return t(`history.detail.programChangeFields.${change.field}`, {
    target,
    from: formatProgramChangeFromValue(change, t),
    to: formatProgramChangeValue(change, t),
  });
}

function hasReorderPositions(entry: AdminActivityLog): entry is AdminActivityLog & {
  metadata: { fromPosition: number; toPosition: number };
} {
  return typeof entry.metadata?.fromPosition === "number" && typeof entry.metadata?.toPosition === "number";
}

function getCreatedAdminUserRole(entry: AdminActivityLog): AdminRole | null {
  return entry.action === "admin_user.created" ? entry.metadata?.adminUserRole ?? null : null;
}

export function getAdminActivityFeedSummary(entry: AdminActivityLog, t: AdminActivityTranslator): string {
  switch (entry.action) {
    case "application.status_updated":
      return t("feed.summary.applicationStatusUpdated", { target: entry.entityLabel });
    case "faq.created":
      return t("feed.summary.faqCreated", { target: entry.entityLabel });
    case "faq.updated":
      return t("feed.summary.faqUpdated", { target: entry.entityLabel });
    case "faq.deleted":
      return t("feed.summary.faqDeleted", { target: entry.entityLabel });
    case "faq.reordered":
      return t("feed.summary.faqReordered", { target: entry.entityLabel });
    case "program_category.created":
      return t("feed.summary.programCategoryCreated", { target: entry.entityLabel });
    case "program_category.updated":
      return t("feed.summary.programCategoryUpdated", { target: entry.entityLabel });
    case "program_category.deleted":
      return t("feed.summary.programCategoryDeleted", { target: entry.entityLabel });
    case "admin_user.created":
      return t(
        getCreatedAdminUserRole(entry) === "superadmin"
          ? "feed.summary.superadminCreated"
          : getCreatedAdminUserRole(entry) === "admin"
            ? "feed.summary.adminCreated"
            : "feed.summary.adminUserCreated",
        { target: entry.entityLabel },
      );
    case "admin_user.updated":
      return t("feed.summary.adminUserUpdated", { target: entry.entityLabel });
    case "admin_user.activated":
      return t("feed.summary.adminUserActivated", { target: entry.entityLabel });
    case "admin_user.deactivated":
      return t("feed.summary.adminUserDeactivated", { target: entry.entityLabel });
    case "admin_user.deleted":
      return t("feed.summary.adminUserDeleted", { target: entry.entityLabel });
    case "home_hero_video.created":
      return t("feed.summary.homeHeroVideoCreated", { target: entry.entityLabel });
    case "home_hero_video.reordered":
      return t("feed.summary.homeHeroVideoReordered");
    case "home_hero_video.deleted":
      return t("feed.summary.homeHeroVideoDeleted", { target: entry.entityLabel });
    case "program.created":
      return t("feed.summary.programCreated", { target: entry.entityLabel });
    case "program.updated":
      return t("feed.summary.programUpdated", { target: entry.entityLabel });
    case "program.published":
      return t("feed.summary.programPublished", { target: entry.entityLabel });
    case "program.archived":
      return t("feed.summary.programArchived", { target: entry.entityLabel });
    case "program.deleted":
      return t("feed.summary.programDeleted", { target: entry.entityLabel });
    case "program.reactivated":
      return t("feed.summary.programReactivated", { target: entry.entityLabel });
  }
}

export function getAdminActivityDetailLines(entry: AdminActivityLog, t: AdminActivityTranslator): string[] {
  switch (entry.action) {
    case "application.status_updated":
      return [
        t("history.detail.applicationStatusUpdated", {
          from: entry.metadata?.fromStatus ? t(`statuses.${entry.metadata.fromStatus}`) : t("feed.unknownPreviousStatus"),
          target: entry.entityLabel,
          to: entry.metadata?.toStatus ? t(`statuses.${entry.metadata.toStatus}`) : t("feed.unknownCurrentStatus"),
        }),
      ];
    case "faq.created":
      return [t("history.detail.faqCreated", { target: entry.entityLabel })];
    case "faq.updated":
      return [t("history.detail.faqUpdated", { target: entry.entityLabel })];
    case "faq.deleted":
      return [t("history.detail.faqDeleted", { target: entry.entityLabel })];
    case "faq.reordered":
      return [t("history.detail.faqReordered", { target: entry.entityLabel })];
    case "program_category.created":
      return [t("history.detail.programCategoryCreated", { target: entry.entityLabel })];
    case "program_category.updated":
      return [t("history.detail.programCategoryUpdated", { target: entry.entityLabel })];
    case "program_category.deleted":
      return [t("history.detail.programCategoryDeleted", { target: entry.entityLabel })];
    case "admin_user.created":
      return [
        t(
          getCreatedAdminUserRole(entry) === "superadmin"
            ? "history.detail.superadminCreated"
            : getCreatedAdminUserRole(entry) === "admin"
              ? "history.detail.adminCreated"
              : "history.detail.adminUserCreated",
          { target: entry.entityLabel },
        ),
      ];
    case "admin_user.updated":
      return [t("history.detail.adminUserUpdated", { target: entry.entityLabel })];
    case "admin_user.activated":
      return [t("history.detail.adminUserActivated", { target: entry.entityLabel })];
    case "admin_user.deactivated":
      return [t("history.detail.adminUserDeactivated", { target: entry.entityLabel })];
    case "admin_user.deleted":
      return [t("history.detail.adminUserDeleted", { target: entry.entityLabel })];
    case "home_hero_video.created":
      return [t("history.detail.homeHeroVideoCreated", { target: entry.entityLabel })];
    case "home_hero_video.reordered":
      return [
        hasReorderPositions(entry)
          ? t("history.detail.homeHeroVideoReorderedWithPositions", {
              target: entry.entityLabel,
              fromPosition: entry.metadata.fromPosition,
              toPosition: entry.metadata.toPosition,
            })
          : t("history.detail.homeHeroVideoReordered", { target: entry.entityLabel }),
      ];
    case "home_hero_video.deleted":
      return [t("history.detail.homeHeroVideoDeleted", { target: entry.entityLabel })];
    case "program.created":
      return [t("history.detail.programCreated", { target: entry.entityLabel })];
    case "program.updated":
      return entry.metadata?.programChanges?.length
        ? entry.metadata.programChanges.map((change) => formatProgramChangeDetail(entry.entityLabel, change, t))
        : [t("history.detail.programUpdated", { target: entry.entityLabel })];
    case "program.published":
      return [t("history.detail.programPublished", { target: entry.entityLabel })];
    case "program.archived":
      return [t("history.detail.programArchived", { target: entry.entityLabel })];
    case "program.deleted":
      return [t("history.detail.programDeleted", { target: entry.entityLabel })];
    case "program.reactivated":
      return [t("history.detail.programReactivated", { target: entry.entityLabel })];
  }
}
