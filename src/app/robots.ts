import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/config/site-origin";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/en/admin", "/api/", "/apply/success", "/en/apply/success"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
