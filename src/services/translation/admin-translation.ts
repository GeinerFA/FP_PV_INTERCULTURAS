import { TranslationError, type TranslationSyncResult } from "@/lib/translation";
import { rateLimit } from "@/lib/rate-limit";

export const adminTranslationOutcomes = ["translated", "up-to-date", "manual", "not-configured", "failed"] as const;

export type AdminTranslationOutcome = (typeof adminTranslationOutcomes)[number];

export type AdminTranslationNotice = {
  outcome: AdminTranslationOutcome;
  /** Provider message safe to show (only for "failed"). */
  message?: string;
};

// Translation spends paid quota, so it is limited per admin: 30 provider calls every 10 minutes.
const adminTranslationRateLimit = { limit: 30, windowMs: 10 * 60_000 };

function formatRetryAfter(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${Math.ceil(seconds / 60)} min`;
}

/** Throws a TranslationError when the admin exceeded the limit. Meant for `beforeTranslate`. */
export function consumeAdminTranslationQuota(adminEmail: string): void {
  const result = rateLimit(`translate:${adminEmail.toLowerCase()}`, adminTranslationRateLimit);

  if (!result.ok) {
    throw new TranslationError(
      `Se hicieron demasiadas traducciones seguidas. Intentá de nuevo en ${formatRetryAfter(result.retryAfterSec)}.`,
    );
  }
}

/**
 * Runs a translation after the source content was already saved and turns any failure into a notice.
 * A failed translation never blocks the source save: it is reported as a warning next to "saved".
 */
export async function runAdminTranslation(
  adminEmail: string,
  task: (beforeTranslate: () => void) => Promise<TranslationSyncResult>,
  logLabel: string,
): Promise<AdminTranslationNotice> {
  try {
    return { outcome: await task(() => consumeAdminTranslationQuota(adminEmail)) };
  } catch (error) {
    if (error instanceof TranslationError) {
      return { outcome: "failed", message: error.message };
    }

    console.error(`[admin-translation] ${logLabel} failed`, error);

    return { outcome: "failed", message: "error inesperado." };
  }
}

/** Query params that carry the notice through the post-save redirect. "up-to-date" needs no notice. */
export function buildTranslationNoticeParams(notice: AdminTranslationNotice | null | undefined): Record<string, string> {
  if (!notice || notice.outcome === "up-to-date") {
    return {};
  }

  return notice.message ? { translation: notice.outcome, translationError: notice.message } : { translation: notice.outcome };
}

export function parseTranslationNotice(
  outcome: string | string[] | undefined,
  message: string | string[] | undefined,
): AdminTranslationNotice | null {
  if (typeof outcome !== "string" || !adminTranslationOutcomes.includes(outcome as AdminTranslationOutcome)) {
    return null;
  }

  return {
    outcome: outcome as AdminTranslationOutcome,
    ...(typeof message === "string" && message.trim() ? { message: message.trim().slice(0, 300) } : {}),
  };
}
