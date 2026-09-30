import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/config/i18n";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
  // The language comes only from the URL ("/" Spanish, "/en" English) and the header switcher. No
  // Accept-Language redirects: they confuse crawlers and would bounce the Spanish-only admin to /en.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/about": "/about",
    "/faqs": "/faqs",
    "/programs": "/programs",
    "/programs/[slug]": "/programs/[slug]",
    "/apply": "/apply",
    "/apply/success": "/apply/success",
    "/contact": "/contact",
    "/admin": "/admin",
    "/admin/login": "/admin/login",
    "/admin/programs": "/admin/programs",
    "/admin/programs/new": "/admin/programs/new",
    "/admin/programs/[id]/edit": "/admin/programs/[id]/edit",
    "/admin/programs/[id]/english": "/admin/programs/[id]/english",
    "/admin/applications": "/admin/applications",
    "/admin/applications/[id]": "/admin/applications/[id]",
    "/admin/activity": "/admin/activity",
    "/admin/activity/[entityType]/[entityId]": "/admin/activity/[entityType]/[entityId]",
    "/admin/settings": "/admin/settings",
    "/admin/settings/categories": "/admin/settings/categories",
    "/admin/settings/faqs": "/admin/settings/faqs",
    "/admin/settings/home-videos": "/admin/settings/home-videos",
    "/admin/settings/translations": "/admin/settings/translations",
    "/admin/settings/users": "/admin/settings/users",
  },
});
