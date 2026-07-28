import { resolveAdminActorDisplayName } from "@/features/admin/lib/admin-actor-label";
import type { AdminActivityLog, AdminProgramActivityChange } from "@/types/admin-activity";

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

export function getAdminActivityFeedSummary(entry: AdminActivityLog, t: AdminActivityTranslator): string {
  switch (entry.action) {
    case "application.status_updated":
      return t("feed.summary.applicationStatusUpdated", { target: entry.entityLabel });
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
