import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.APP_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/en/admin", "/api/", "/apply/success", "/en/apply/success"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
