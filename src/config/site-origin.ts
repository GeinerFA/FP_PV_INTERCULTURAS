const localOrigin = "http://localhost:3000";

/**
 * Public origin of the site (no trailing slash) for canonical URLs, sitemap, robots and
 * structured data. Uses APP_ORIGIN; on Vercel falls back to the production domain Vercel
 * exposes automatically, so search engines never see localhost URLs if APP_ORIGIN is missing.
 */
type SiteOriginEnv = {
  APP_ORIGIN?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

export function getSiteOrigin(
  env: SiteOriginEnv = {
    APP_ORIGIN: process.env.APP_ORIGIN,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
): string {
  const candidates = [
    env.APP_ORIGIN,
    env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();

    if (!trimmed) {
      continue;
    }

    try {
      return new URL(trimmed).origin;
    } catch {
      // Invalid value: try the next candidate.
    }
  }

  return localOrigin;
}
