export const siteConfig = {
  name: "Pura Vida Interculturas",
  adminName: "Pura Vida Interculturas Admin",
  description:
    "Programas y experiencias interculturales con orientación clara para explorar oportunidades, postular y contactar a Pura Vida Interculturas.",
  publicNavigation: [
    { href: "/", labelKey: "home" },
    { href: "/about", labelKey: "about" },
    { href: "/programs", labelKey: "programs" },
    { href: "/faqs", labelKey: "faqs" },
    { href: "/apply", labelKey: "apply" },
  ],
  adminNavigation: [
    { href: "/admin", labelKey: "dashboard" },
    { href: "/admin/programs", labelKey: "programs" },
    { href: "/admin/applications", labelKey: "applications" },
    { href: "/admin/activity", labelKey: "activity" },
    { href: "/admin/settings", labelKey: "settings" },
  ],
} as const;
