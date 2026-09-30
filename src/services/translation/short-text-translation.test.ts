import assert from "node:assert/strict";
import test from "node:test";

import type { Translator } from "@/lib/translation/types";

import { getShortTextTranslationStatus, hashShortTextSource, resolveShortTextTranslation } from "./short-text-translation";

const source = { question: "¿Necesito hablar español?", answer: "No siempre." };

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

test("translates a new entry automatically", async () => {
  const { translator } = createRecordingTranslator();

  const { next, result } = await resolveShortTextTranslation({ locale: "en", source, current: null, translator });

  assert.equal(result, "translated");
  assert.deepEqual(next?.content, { question: "EN:¿Necesito hablar español?", answer: "EN:No siempre." });
  assert.equal(next?.meta.source, "machine");
});

test("keeps edited English fields as a manual translation without calling the provider", async () => {
  const { calls, translator } = createRecordingTranslator();
  const current = {
    content: { question: "EN:¿Necesito hablar español?", answer: "EN:No siempre." },
    meta: { source: "machine" as const, sourceHash: hashShortTextSource(source), translatedAt: "2026-09-01T00:00:00.000Z" },
  };

  const { next, result } = await resolveShortTextTranslation({
    locale: "en",
    source,
    current,
    submitted: { question: "Do I need to speak Spanish?", answer: "Not always." },
    translator,
  });

  assert.equal(result, "up-to-date");
  assert.equal(calls.length, 0);
  assert.equal(next?.meta.source, "manual");
  assert.equal(next?.meta.translatedAt, "2026-09-01T00:00:00.000Z");
  assert.equal(getShortTextTranslationStatus(source, next), "manual");
});

test("does not overwrite a manual translation when the source changes, unless the fields are cleared", async () => {
  const { calls, translator } = createRecordingTranslator();
  const manual = {
    content: { question: "Do I need to speak Spanish?", answer: "Not always." },
    meta: { source: "manual" as const, sourceHash: hashShortTextSource(source), translatedAt: null },
  };
  const changedSource = { ...source, answer: "Depende del programa." };

  const kept = await resolveShortTextTranslation({
    locale: "en",
    source: changedSource,
    current: manual,
    submitted: manual.content,
    translator,
  });

  assert.equal(kept.result, "manual");
  assert.equal(kept.next, null);
  assert.equal(calls.length, 0);
  assert.equal(getShortTextTranslationStatus(changedSource, manual), "manual-stale");

  const cleared = await resolveShortTextTranslation({
    locale: "en",
    source: changedSource,
    current: manual,
    submitted: { question: "", answer: "" },
    translator,
  });

  assert.equal(cleared.result, "translated");
  assert.equal(cleared.next?.content.answer, "EN:Depende del programa.");
});

test("an unchanged source with an up-to-date translation needs no provider call", async () => {
  const { calls, translator } = createRecordingTranslator();
  const current = {
    content: { question: "Q", answer: "A" },
    meta: { source: "machine" as const, sourceHash: hashShortTextSource(source), translatedAt: null },
  };

  const { next, result } = await resolveShortTextTranslation({
    locale: "en",
    source,
    current,
    submitted: current.content,
    translator,
  });

  assert.equal(result, "up-to-date");
  assert.equal(next, null);
  assert.equal(calls.length, 0);
});
