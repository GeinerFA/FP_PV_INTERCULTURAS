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
    "/admin": "/admin",
    "/admin/login": "/admin/login",
    "/admin/programs": "/admin/programs",
    "/admin/programs/new": "/admin/programs/new",
    "/admin/programs/[id]/edit": "/admin/programs/[id]/edit",
    "/admin/applications": "/admin/applications",
    "/admin/applications/[id]": "/admin/applications/[id]",
    "/admin/reports": "/admin/reports",
    "/admin/activity": "/admin/activity",
    "/admin/settings": "/admin/settings",
  },
});
