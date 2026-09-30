import { Schema } from "mongoose";

import { translationTargetLocales } from "@/config/i18n";
import { translationSources } from "@/lib/translation/types";

/**
 * Per-locale translation of a few short text fields, stored flat:
 * `translations.en = { question, answer, source, sourceHash, translatedAt }`.
 */
export function createShortTextTranslationsSchema(fields: readonly string[]): Schema {
  const entrySchema = new Schema(
    {
      ...Object.fromEntries(fields.map((field) => [field, { type: String, trim: true, default: "" }])),
      source: {
        type: String,
        enum: translationSources,
        required: true,
      },
      sourceHash: {
        type: String,
        required: true,
        trim: true,
      },
      translatedAt: {
        type: Date,
        default: null,
      },
    },
    { _id: false },
  );

  return new Schema(
    Object.fromEntries(translationTargetLocales.map((locale) => [locale, { type: entrySchema, default: null }])),
    { _id: false },
  );
}
