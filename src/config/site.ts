export const siteConfig = {
  name: "Pura Vida Interculturas",
  adminName: "Pura Vida Interculturas Admin",
  description:
    "Plataforma para visibilidad internacional, captación de voluntariado y gestión administrativa del MVP.",
  publicNavigation: [
    { href: "/", labelKey: "home" },
    { href: "/about", labelKey: "about" },
    { href: "/programs", labelKey: "programs" },
    { href: "/faqs", labelKey: "faqs" },
    { href: "/apply", labelKey: "apply" },
    { href: "/impact", labelKey: "impact" },
    { href: "/privacy", labelKey: "privacy" },
  ],
  adminNavigation: [
    { href: "/admin", labelKey: "dashboard" },
    { href: "/admin/programs", labelKey: "programs" },
    { href: "/admin/applications", labelKey: "applications" },
    { href: "/admin/activity", labelKey: "activity" },
    { href: "/admin/settings", labelKey: "settings" },
  ],
} as const;
