import type { AdminSession } from "@/lib/admin-session";
import type { AdminProgramCategory } from "@/types/category";
import type { FaqEntry } from "@/types/faq";
import type { HomeHeroVideoRecord } from "@/types/home-hero-video";
import type { AdminUserRecord } from "@/types/admin-user";

type AdminActivityActorLike = Pick<AdminSession, "displayName" | "email">;

function trimToLength(value: string, maxLength: number): string {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function createAdminActivityActor(session: AdminActivityActorLike) {
  return {
    displayName: session.displayName ?? undefined,
    email: session.email,
    role: "admin" as const,
  };
}

export function resolveFaqActivityLabel(faq: Pick<FaqEntry, "id" | "question">): string {
  return trimToLength(faq.question, 96) || faq.id;
}

export function resolveProgramCategoryActivityLabel(category: Pick<AdminProgramCategory, "id" | "name" | "code">): string {
  return category.name.trim() || category.code.trim() || category.id;
}

export function resolveAdminUserActivityLabel(user: Pick<AdminUserRecord, "id" | "email" | "fullName">): string {
  const fullName = user.fullName.trim();
  const email = user.email.trim();

  if (fullName && email) {
    return `${fullName} · ${email}`;
  }

  return fullName || email || user.id;
}

export function resolveHomeHeroVideoActivityLabel(video: Pick<HomeHeroVideoRecord, "id" | "fileName" | "mediaType">): string {
  const fileName = video.fileName.trim();

  return fileName || `${video.mediaType} ${video.id}`;
}
