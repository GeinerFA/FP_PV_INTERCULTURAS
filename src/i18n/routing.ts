import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/config/i18n";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/about": "/about",
    "/programs": "/programs",
    "/programs/[slug]": "/programs/[slug]",
    "/apply": "/apply",
    "/apply/success": "/apply/success",
    "/impact": "/impact",
    "/contact": "/contact",
    "/privacy": "/privacy",
  },
});
