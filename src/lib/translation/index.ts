import { createHash } from "node:crypto";

import type { AppLocale } from "@/config/i18n";

import { createDeepLTranslator } from "./deepl";
import type { TranslationMeta, TranslationStatus, Translator } from "./types";

export { TranslationError } from "./types";
export type { TranslationMeta, TranslationSource, TranslationStatus, TranslationSyncResult, Translator } from "./types";

/** Provider from TRANSLATION_PROVIDER (DeepL by default), or null when it is not configured. */
export function getTranslator(): Translator | null {
  const provider = (process.env.TRANSLATION_PROVIDER?.trim() || "deepl").toLowerCase();

  if (provider === "deepl") {
    const apiKey = process.env.DEEPL_API_KEY?.trim();

    return apiKey ? createDeepLTranslator(apiKey) : null;
  }

  return null;
}

export function isTranslationConfigured(): boolean {
  return getTranslator() !== null;
}

/** Translates while skipping empty texts: they cost quota and some providers reject them. */
export async function translateTexts(
  translator: Translator,
  texts: string[],
  from: AppLocale,
  to: AppLocale,
): Promise<string[]> {
  const pending = texts
    .map((text, index) => ({ text: text.trim(), index }))
    .filter((entry) => entry.text.length > 0);
  const translated = pending.length > 0 ? await translator.translate(pending.map((entry) => entry.text), from, to) : [];
  const result = texts.map(() => "");

  pending.forEach((entry, position) => {
    result[entry.index] = translated[position]?.trim() ?? "";
  });

  return result;
}

/** Stable hash of the translatable source content: when it changes, the translation is out of date. */
export function hashTranslatableContent(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

export function resolveTranslationStatus(
  sourceHash: string,
  meta: TranslationMeta | null | undefined,
): TranslationStatus {
  if (!meta) {
    return "missing";
  }

  const isStale = meta.sourceHash !== sourceHash;

  if (meta.source === "manual") {
    return isStale ? "manual-stale" : "manual";
  }

  return isStale ? "machine-stale" : "machine";
}
