export const locales = ["es", "en"] as const;

export const defaultLocale = "es";

export type AppLocale = (typeof locales)[number];
