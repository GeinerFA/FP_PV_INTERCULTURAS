import assert from "node:assert/strict";
import test from "node:test";

import type { Translator } from "@/lib/translation/types";
import type { ProgramSnapshot } from "@/types/program";
import { parseProgramSnapshot } from "@/validators/program";

import {
  applyProgramLocaleContent,
  extractProgramTranslatableContent,
  flattenProgramTranslatableContent,
  getProgramTranslationStatus,
  hashProgramSourceContent,
  rebuildProgramTranslatableContent,
} from "./program-translation-content";
import { planProgramTranslation } from "./program-translation-service";

function createSnapshot(overrides: { title?: string } = {}): ProgramSnapshot {
  // Stored before English existed: no `en` keys and no translationMeta.
  return parseProgramSnapshot({
    slug: "voluntariado-museo",
    category: "volunteer",
    featured: false,
    coverImage: "https://example.com/cover.jpg",
    location: { es: "San Ramón" },
    duration: { es: "2 semanas" },
    availability: { es: "Todo el año" },
    translations: {
      es: {
        title: overrides.title ?? "Voluntariado en museo",
        shortDescription: "Apoyo en el museo",
        fullDescription: "Descripción completa",
        requirements: ["Inglés básico"],
        included: ["Inducción", "Acompañamiento"],
      },
    },
    seo: { es: { title: "Voluntariado", description: "Descripción SEO" } },
  });
}

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

test("snapshots stored before English existed parse with empty English content", () => {
  const snapshot = createSnapshot();

  assert.equal(snapshot.translations.en.title, "");
  assert.equal(snapshot.location.en, "");
  assert.deepEqual(snapshot.translationMeta, {});
  assert.equal(getProgramTranslationStatus(snapshot, "en"), "missing");
});

test("flatten and rebuild keep every field and list item in place", () => {
  const source = extractProgramTranslatableContent(createSnapshot(), "es");
  const texts = flattenProgramTranslatableContent(source).map((text) => `EN:${text}`);
  const rebuilt = rebuildProgramTranslatableContent(texts, source);

  assert.equal(rebuilt.title, "EN:Voluntariado en museo");
  assert.equal(rebuilt.location, "EN:San Ramón");
  assert.deepEqual(rebuilt.requirements, ["EN:Inglés básico"]);
  assert.deepEqual(rebuilt.included, ["EN:Inducción", "EN:Acompañamiento"]);
});

test("rebuild keeps the source text when the provider returns an empty required field", () => {
  const source = extractProgramTranslatableContent(createSnapshot(), "es");
  const texts = flattenProgramTranslatableContent(source).map(() => "");

  assert.equal(rebuildProgramTranslatableContent(texts, source).title, "Voluntariado en museo");
});

test("translates a missing translation and mirrors it into the published snapshot with the same source", async () => {
  const snapshot = createSnapshot();
  const { calls, translator } = createRecordingTranslator();

  const plan = await planProgramTranslation({ draftSnapshot: snapshot, publishedSnapshot: snapshot }, "en", { translator });

  assert.equal(plan.result, "translated");
  assert.equal(calls.length, 1, "draft and published share the source, so the provider is called once");
  assert.equal(plan.draftSnapshot?.translations.en.title, "EN:Voluntariado en museo");
  assert.equal(plan.draftSnapshot?.translationMeta?.en?.source, "machine");
  assert.equal(plan.draftSnapshot?.translationMeta?.en?.sourceHash, hashProgramSourceContent(snapshot));
  assert.deepEqual(plan.publishedSnapshot?.translations.en, plan.draftSnapshot?.translations.en);
});

test("an up-to-date translation does not call the provider nor run beforeTranslate", async () => {
  const { translator: firstTranslator } = createRecordingTranslator();
  const translated = (await planProgramTranslation({ draftSnapshot: createSnapshot(), publishedSnapshot: null }, "en", {
    translator: firstTranslator,
  })).draftSnapshot!;
  const { calls, translator } = createRecordingTranslator();
  let beforeTranslateCalls = 0;

  const plan = await planProgramTranslation({ draftSnapshot: translated, publishedSnapshot: null }, "en", {
    translator,
    beforeTranslate: () => {
      beforeTranslateCalls += 1;
    },
  });

  assert.equal(plan.result, "up-to-date");
  assert.equal(plan.draftSnapshot, null);
  assert.equal(calls.length, 0);
  assert.equal(beforeTranslateCalls, 0);
});

test("a manual translation survives source changes until it is forced", async () => {
  const original = createSnapshot();
  const manualContent = { ...extractProgramTranslatableContent(original, "es"), title: "Museum volunteering (edited)" };
  const manual = applyProgramLocaleContent(original, "en", manualContent, {
    source: "manual",
    sourceHash: hashProgramSourceContent(original),
    translatedAt: null,
  });
  const changedSource = { ...manual, translations: { ...manual.translations, es: { ...manual.translations.es, title: "Nuevo título" } } };
  const { calls, translator } = createRecordingTranslator();

  assert.equal(getProgramTranslationStatus(changedSource, "en"), "manual-stale");

  const kept = await planProgramTranslation({ draftSnapshot: changedSource, publishedSnapshot: null }, "en", { translator });

  assert.equal(kept.result, "manual");
  assert.equal(kept.draftSnapshot, null);
  assert.equal(calls.length, 0);

  const forced = await planProgramTranslation({ draftSnapshot: changedSource, publishedSnapshot: null }, "en", {
    translator,
    force: true,
  });

  assert.equal(forced.result, "translated");
  assert.equal(forced.draftSnapshot?.translations.en.title, "EN:Nuevo título");
  assert.equal(forced.draftSnapshot?.translationMeta?.en?.source, "machine");
});

test("reports not-configured without a provider and never blocks", async () => {
  const plan = await planProgramTranslation({ draftSnapshot: createSnapshot(), publishedSnapshot: null }, "en", {
    translator: null,
  });

  assert.equal(plan.result, "not-configured");
  assert.equal(plan.draftSnapshot, null);
});

test("with unpublished source changes, the published snapshot is translated from its own source", async () => {
  const published = createSnapshot();
  const draft = createSnapshot({ title: "Título en borrador" });
  const { calls, translator } = createRecordingTranslator();

  const plan = await planProgramTranslation({ draftSnapshot: draft, publishedSnapshot: published }, "en", { translator });

  assert.equal(calls.length, 2);
  assert.equal(plan.draftSnapshot?.translations.en.title, "EN:Título en borrador");
  assert.equal(plan.publishedSnapshot?.translations.en.title, "EN:Voluntariado en museo");
});
