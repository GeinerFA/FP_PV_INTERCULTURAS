import type { Metadata } from "next";

import { defaultLocale, locales, type AppLocale } from "@/config/i18n";
import { siteConfig } from "@/config/site";
import { getPathname } from "@/i18n/navigation";

type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

type MetadataInput = {
  title: string;
  description: string;
  /** Locale of the current page; with `href` it adds canonical and hreflang links. */
  locale?: AppLocale;
  /** Internal (locale-less) route of the page, e.g. "/programs" or { pathname: "/programs/[slug]", params }. */
  href?: LocalizedHref;
  /** Locales in which this page exists (all by default); untranslated programs only exist in Spanish. */
  availableLocales?: readonly AppLocale[];
};

/** Canonical URL plus one hreflang alternate per available locale and x-default (the source locale). */
export function buildLanguageAlternates(
  href: LocalizedHref,
  locale: AppLocale,
  availableLocales: readonly AppLocale[] = locales,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = Object.fromEntries(
    availableLocales.map((availableLocale) => [availableLocale, getPathname({ href, locale: availableLocale })]),
  );

  if (availableLocales.includes(defaultLocale)) {
    languages["x-default"] = getPathname({ href, locale: defaultLocale });
  }

  return {
    canonical: getPathname({ href, locale }),
    languages,
  };
}

export function buildMetadata({ title, description, locale, href, availableLocales }: MetadataInput): Metadata {
  return {
    title,
    description,
    ...(locale && href ? { alternates: buildLanguageAlternates(href, locale, availableLocales) } : {}),
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      type: "website",
      ...(locale ? { locale: locale === "en" ? "en_US" : "es_CR" } : {}),
    },
  };
}
