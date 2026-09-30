export const locales = ["es", "en"] as const;

export const defaultLocale = "es" as const;

export type AppLocale = (typeof locales)[number];

/** Content is written in this locale in the admin; every other locale is generated from it. */
export const sourceLocale = defaultLocale;

/** Locales whose dynamic content (programs, FAQs, categories) is machine translated from the source. */
export const translationTargetLocales = ["en"] as const;

export type TranslationTargetLocale = (typeof translationTargetLocales)[number];
