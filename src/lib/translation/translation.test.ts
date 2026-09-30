import assert from "node:assert/strict";
import test from "node:test";

import { createDeepLTranslator } from "./deepl";
import { hashTranslatableContent, resolveTranslationStatus, translateTexts } from "./index";
import { TranslationError, type Translator } from "./types";

function createRecordingTranslator() {
  const calls: string[][] = [];
  const translator: Translator = {
    name: "fake",
    async translate(texts) {
      calls.push(texts);
      return texts.map((text) => `EN:${text}`);
    },
  };

  return { calls, translator };
}

test("translateTexts skips empty texts and keeps positions", async () => {
  const { calls, translator } = createRecordingTranslator();

  const result = await translateTexts(translator, ["Hola", "", "  ", "Adiós"], "es", "en");

  assert.deepEqual(calls, [["Hola", "Adiós"]]);
  assert.deepEqual(result, ["EN:Hola", "", "", "EN:Adiós"]);
});

test("translateTexts does not call the provider when every text is empty", async () => {
  const { calls, translator } = createRecordingTranslator();

  assert.deepEqual(await translateTexts(translator, ["", " "], "es", "en"), ["", ""]);
  assert.equal(calls.length, 0);
});

test("resolveTranslationStatus distinguishes fresh, stale, manual and missing translations", () => {
  const hash = hashTranslatableContent(["Título"]);
  const otherHash = hashTranslatableContent(["Otro título"]);

  assert.equal(resolveTranslationStatus(hash, null), "missing");
  assert.equal(resolveTranslationStatus(hash, { source: "machine", sourceHash: hash, translatedAt: null }), "machine");
  assert.equal(resolveTranslationStatus(hash, { source: "machine", sourceHash: otherHash, translatedAt: null }), "machine-stale");
  assert.equal(resolveTranslationStatus(hash, { source: "manual", sourceHash: hash, translatedAt: null }), "manual");
  assert.equal(resolveTranslationStatus(hash, { source: "manual", sourceHash: otherHash, translatedAt: null }), "manual-stale");
});

test("DeepL translator uses the free endpoint for :fx keys, sends batches of 50 and targets EN-US", async () => {
  const requests: Array<{ url: string; body: { text: string[]; source_lang: string; target_lang: string } }> = [];
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));

    requests.push({ url: String(url), body });

    return new Response(JSON.stringify({ translations: body.text.map((text: string) => ({ text: `EN:${text}` })) }), {
      status: 200,
    });
  }) as typeof fetch;
  const translator = createDeepLTranslator("key:fx", fakeFetch);
  const texts = Array.from({ length: 60 }, (_, index) => `texto ${index}`);

  const result = await translator.translate(texts, "es", "en");

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "https://api-free.deepl.com/v2/translate");
  assert.equal(requests[0].body.text.length, 50);
  assert.equal(requests[1].body.text.length, 10);
  assert.equal(requests[0].body.source_lang, "ES");
  assert.equal(requests[0].body.target_lang, "EN-US");
  assert.equal(result[59], "EN:texto 59");
});

test("DeepL translator maps quota and auth errors to readable messages", async () => {
  const failingFetch = (status: number) => (async () => new Response("{}", { status })) as typeof fetch;

  await assert.rejects(
    createDeepLTranslator("key", failingFetch(456)).translate(["hola"], "es", "en"),
    (error: unknown) => error instanceof TranslationError && error.message === "Se agotó la cuota mensual de DeepL.",
  );
  await assert.rejects(
    createDeepLTranslator("key", failingFetch(403)).translate(["hola"], "es", "en"),
    (error: unknown) => error instanceof TranslationError && error.message.includes("DEEPL_API_KEY"),
  );
});
