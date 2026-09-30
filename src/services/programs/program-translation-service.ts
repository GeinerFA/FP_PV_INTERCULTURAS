import { sourceLocale, type TranslationTargetLocale } from "@/config/i18n";
import { getTranslator, translateTexts, type TranslationSyncResult, type Translator } from "@/lib/translation";
import type { TranslationMeta } from "@/lib/translation/types";
import type { ProgramRecord, ProgramSnapshot, ProgramTranslatableContent } from "@/types/program";

import { getProgramRepository } from "./program-repository";
import {
  applyProgramLocaleContent,
  extractProgramTranslatableContent,
  flattenProgramTranslatableContent,
  getProgramTranslationMeta,
  hashProgramSourceContent,
  rebuildProgramTranslatableContent,
} from "./program-translation-content";

export type TranslationSyncOptions = {
  /** Retranslate even when the translation is up to date or was corrected by hand. */
  force?: boolean;
  /** Runs right before the first provider call (e.g. a rate limit), so no-op syncs never consume it. */
  beforeTranslate?: () => void;
  /** Overrides the configured provider (tests). */
  translator?: Translator | null;
};

type SnapshotSyncPlan = {
  next: ProgramSnapshot | null;
  result: TranslationSyncResult;
};

function isSameLocaleContent(left: ProgramSnapshot, right: ProgramSnapshot, locale: TranslationTargetLocale): boolean {
  return (
    JSON.stringify([extractProgramTranslatableContent(left, locale), getProgramTranslationMeta(left, locale)]) ===
    JSON.stringify([extractProgramTranslatableContent(right, locale), getProgramTranslationMeta(right, locale)])
  );
}

/**
 * Computes the translation updates for a program record without persisting them.
 *
 * The draft is the working copy, so it is always synced. The published snapshot mirrors the draft's
 * translation when both share the same source text; if the draft has unpublished source changes, the
 * published snapshot is synced on its own (never forced), so the live site keeps a matching translation.
 */
export async function planProgramTranslation(
  record: Pick<ProgramRecord, "draftSnapshot" | "publishedSnapshot">,
  locale: TranslationTargetLocale,
  { force = false, beforeTranslate, translator: translatorOverride }: TranslationSyncOptions = {},
): Promise<{ draftSnapshot: ProgramSnapshot | null; publishedSnapshot: ProgramSnapshot | null; result: TranslationSyncResult }> {
  const translatedBySourceHash = new Map<string, ProgramTranslatableContent>();
  let translator: Translator | null | undefined;
  let hasCalledBeforeTranslate = false;

  async function translateSnapshot(snapshot: ProgramSnapshot, sourceHash: string): Promise<ProgramTranslatableContent | null> {
    const cached = translatedBySourceHash.get(sourceHash);

    if (cached) {
      return cached;
    }

    translator ??= translatorOverride !== undefined ? translatorOverride : getTranslator();

    if (!translator) {
      return null;
    }

    if (!hasCalledBeforeTranslate) {
      hasCalledBeforeTranslate = true;
      beforeTranslate?.();
    }

    const source = extractProgramTranslatableContent(snapshot, sourceLocale);
    const translatedTexts = await translateTexts(translator, flattenProgramTranslatableContent(source), sourceLocale, locale);
    const content = rebuildProgramTranslatableContent(translatedTexts, source);

    translatedBySourceHash.set(sourceHash, content);

    return content;
  }

  async function planSnapshot(snapshot: ProgramSnapshot, forceSnapshot: boolean): Promise<SnapshotSyncPlan> {
    const sourceHash = hashProgramSourceContent(snapshot);
    const meta = getProgramTranslationMeta(snapshot, locale);

    if (!forceSnapshot && meta?.sourceHash === sourceHash) {
      return { next: null, result: "up-to-date" };
    }

    if (!forceSnapshot && meta?.source === "manual") {
      return { next: null, result: "manual" };
    }

    const content = await translateSnapshot(snapshot, sourceHash);

    if (!content) {
      return { next: null, result: "not-configured" };
    }

    const nextMeta: TranslationMeta = { source: "machine", sourceHash, translatedAt: new Date().toISOString() };

    return { next: applyProgramLocaleContent(snapshot, locale, content, nextMeta), result: "translated" };
  }

  const draftPlan = await planSnapshot(record.draftSnapshot, force);
  const draftAfter = draftPlan.next ?? record.draftSnapshot;
  let publishedNext: ProgramSnapshot | null = null;

  if (record.publishedSnapshot) {
    const draftMeta = getProgramTranslationMeta(draftAfter, locale);

    if (hashProgramSourceContent(record.publishedSnapshot) === hashProgramSourceContent(draftAfter)) {
      if (draftMeta && !isSameLocaleContent(record.publishedSnapshot, draftAfter, locale)) {
        publishedNext = applyProgramLocaleContent(
          record.publishedSnapshot,
          locale,
          extractProgramTranslatableContent(draftAfter, locale),
          draftMeta,
        );
      }
    } else {
      publishedNext = (await planSnapshot(record.publishedSnapshot, false)).next;
    }
  }

  return {
    draftSnapshot: draftPlan.next,
    publishedSnapshot: publishedNext,
    result: draftPlan.result === "up-to-date" && publishedNext ? "translated" : draftPlan.result,
  };
}

/** Generates or refreshes a program translation from its source content and persists it. */
export async function syncProgramTranslation(
  id: string,
  locale: TranslationTargetLocale,
  options: TranslationSyncOptions = {},
): Promise<TranslationSyncResult> {
  const repository = getProgramRepository();
  const record = await repository.findById(id);

  if (!record) {
    throw new Error(`Program ${id} was not found.`);
  }

  const plan = await planProgramTranslation(record, locale, options);

  if (plan.draftSnapshot || plan.publishedSnapshot) {
    await repository.saveLocaleContent({
      id,
      locale,
      draftSnapshot: plan.draftSnapshot,
      publishedSnapshot: plan.publishedSnapshot,
    });
  }

  return plan.result;
}

/**
 * Saves a hand-corrected translation. It records the hash of the *current* source, meaning "a person
 * reviewed this translation against this text": if the source changes later it becomes manual-stale.
 * It also goes live right away when the published snapshot has the same source text.
 */
export async function saveProgramManualTranslation(
  id: string,
  locale: TranslationTargetLocale,
  content: ProgramTranslatableContent,
): Promise<ProgramRecord | null> {
  const repository = getProgramRepository();
  const record = await repository.findById(id);

  if (!record) {
    return null;
  }

  const sourceHash = hashProgramSourceContent(record.draftSnapshot);
  const meta: TranslationMeta = {
    source: "manual",
    sourceHash,
    // translatedAt keeps marking the last machine translation.
    translatedAt: getProgramTranslationMeta(record.draftSnapshot, locale)?.translatedAt ?? null,
  };
  const publishedSharesSource =
    record.publishedSnapshot !== null && hashProgramSourceContent(record.publishedSnapshot) === sourceHash;

  return repository.saveLocaleContent({
    id,
    locale,
    draftSnapshot: applyProgramLocaleContent(record.draftSnapshot, locale, content, meta),
    publishedSnapshot:
      publishedSharesSource && record.publishedSnapshot
        ? applyProgramLocaleContent(record.publishedSnapshot, locale, content, meta)
        : null,
  });
}

export type BulkTranslationSummary = {
  translated: number;
  upToDate: number;
  manual: number;
};

/** Translates every program that is missing a translation or has a stale machine translation. */
export async function syncPendingProgramTranslations(
  locale: TranslationTargetLocale,
  options: Omit<TranslationSyncOptions, "force"> = {},
): Promise<BulkTranslationSummary> {
  const repository = getProgramRepository();
  const records = await repository.list({ seedBootstrap: false });
  const summary: BulkTranslationSummary = { translated: 0, upToDate: 0, manual: 0 };

  for (const record of records) {
    const plan = await planProgramTranslation(record, locale, options);

    if (plan.result === "not-configured") {
      throw new Error("Translation provider is not configured.");
    }

    if (plan.draftSnapshot || plan.publishedSnapshot) {
      await repository.saveLocaleContent({
        id: record.id,
        locale,
        draftSnapshot: plan.draftSnapshot,
        publishedSnapshot: plan.publishedSnapshot,
      });
    }

    if (plan.result === "translated") {
      summary.translated += 1;
    } else if (plan.result === "manual") {
      summary.manual += 1;
    } else {
      summary.upToDate += 1;
    }
  }

  return summary;
}
