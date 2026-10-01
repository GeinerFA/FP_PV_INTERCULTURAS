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
  /** Use the title as-is, without the "| Pura Vida Interculturas" suffix (home page, which already starts with the brand). */
  absoluteTitle?: boolean;
  /** Share image for this page (e.g. a program cover); only http(s) or root-relative URLs are used. */
  image?: string | null;
};

/** Default share image (logo) for OpenGraph/Twitter; resolved against metadataBase. */
export const defaultShareImage = {
  url: "/branding/nuevo-logo.png",
  width: 2420,
  height: 778,
  alt: siteConfig.name,
} as const;

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

export function buildMetadata({
  title,
  description,
  locale,
  href,
  availableLocales,
  absoluteTitle = false,
  image,
}: MetadataInput): Metadata {
  const alternates = locale && href ? buildLanguageAlternates(href, locale, availableLocales) : undefined;
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  // Data URLs (embedded images) are too large for share tags; fall back to the logo.
  const shareImage = image && /^(https?:\/\/|\/)/.test(image) ? { url: image, alt: title } : defaultShareImage;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(alternates ? { alternates } : {}),
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      siteName: siteConfig.name,
      images: [shareImage],
      ...(typeof alternates?.canonical === "string" ? { url: alternates.canonical } : {}),
      ...(locale ? { locale: locale === "en" ? "en_US" : "es_CR" } : {}),
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
      images: [shareImage.url],
    },
  };
}
