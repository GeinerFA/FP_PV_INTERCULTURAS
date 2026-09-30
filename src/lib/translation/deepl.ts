import type { AppLocale } from "@/config/i18n";

import { TranslationError, type Translator } from "./types";

const sourceLanguageCodes: Record<AppLocale, string> = { es: "ES", en: "EN" };
// DeepL requires a regional variant when English is the target language.
const targetLanguageCodes: Record<AppLocale, string> = { es: "ES", en: "EN-US" };

/** DeepL accepts up to 50 texts per request. */
const deeplBatchSize = 50;

const deeplStatusMessages: Record<number, string> = {
  403: "La clave de DeepL (DEEPL_API_KEY) es inválida.",
  429: "DeepL recibió demasiadas solicitudes. Intentá de nuevo en un momento.",
  456: "Se agotó la cuota mensual de DeepL.",
};

export function createDeepLTranslator(apiKey: string, fetchImpl: typeof fetch = fetch): Translator {
  // Free-plan keys end in ":fx" and use a different host.
  const endpoint = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  async function translateBatch(texts: string[], from: AppLocale, to: AppLocale): Promise<string[]> {
    let response: Response;

    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: texts,
          source_lang: sourceLanguageCodes[from],
          target_lang: targetLanguageCodes[to],
          preserve_formatting: true,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new TranslationError("No se pudo conectar con DeepL.");
    }

    if (!response.ok) {
      throw new TranslationError(
        deeplStatusMessages[response.status] ?? `DeepL respondió con un error (${response.status}).`,
      );
    }

    const data = (await response.json()) as { translations?: Array<{ text?: unknown }> };
    const translations = Array.isArray(data.translations) ? data.translations : [];

    if (translations.length !== texts.length) {
      throw new TranslationError("DeepL devolvió una respuesta incompleta.");
    }

    return translations.map((translation) => (typeof translation.text === "string" ? translation.text : ""));
  }

  return {
    name: "DeepL",
    async translate(texts, from, to) {
      const results: string[] = [];

      for (let index = 0; index < texts.length; index += deeplBatchSize) {
        results.push(...(await translateBatch(texts.slice(index, index + deeplBatchSize), from, to)));
      }

      return results;
    },
  };
}
