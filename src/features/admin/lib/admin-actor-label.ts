import type { AdminActivityActor } from "@/types/admin-activity";

function normalizeToken(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function formatAdminActorNameFromEmail(email: string): string | null {
  const localPart = email.split("@")[0]?.split("+")[0]?.trim();

  if (!localPart) {
    return null;
  }

  const tokens = localPart
    .split(/[._-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map(normalizeToken).join(" ");
}

export function resolveAdminActorDisplayName(actor: AdminActivityActor | undefined): string | null {
  const displayName = actor?.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  if (actor?.email) {
    return formatAdminActorNameFromEmail(actor.email) ?? actor.email;
  }

  return null;
}
