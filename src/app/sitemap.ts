import type { MetadataRoute } from "next";

import { locales, type AppLocale } from "@/config/i18n";
import { getSiteOrigin } from "@/config/site-origin";
import { getPathname } from "@/i18n/navigation";
import { listPublishedProgramSlugsWithLocales } from "@/services/programs/program-service";

type SitemapHref = Parameters<typeof getPathname>[0]["href"];

const staticPublicHrefs = ["/", "/about", "/programs", "/faqs", "/apply"] as const;

// Regenerated at most hourly; program changes also show up after the next regeneration.
export const revalidate = 3600;

function resolveOrigin(): string {
  return getSiteOrigin();
}

function buildEntries(
  origin: string,
  href: SitemapHref,
  availableLocales: readonly AppLocale[],
  lastModified?: string,
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    availableLocales.map((locale) => [locale, `${origin}${getPathname({ href, locale })}`]),
  );

  return availableLocales.map((locale) => ({
    url: `${origin}${getPathname({ href, locale })}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = resolveOrigin();
  const programs = await listPublishedProgramSlugsWithLocales();

  return [
    ...staticPublicHrefs.flatMap((href) => buildEntries(origin, href, locales)),
    ...programs.flatMap((program) =>
      buildEntries(
        origin,
        { pathname: "/programs/[slug]", params: { slug: program.slug } },
        program.locales,
        program.updatedAt,
      ),
    ),
  ];
}
