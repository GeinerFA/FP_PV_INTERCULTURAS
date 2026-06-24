export const locales = ["es"] as const;

export const defaultLocale = "es";

export type AppLocale = (typeof locales)[number];
