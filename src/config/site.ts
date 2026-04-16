export const siteConfig = {
  name: "Pura Vida Interculturas",
  adminName: "Pura Vida Interculturas Admin",
  description:
    "Plataforma para visibilidad internacional, captación de voluntariado y gestión administrativa del MVP.",
  publicNavigation: [
    { href: "/", labelKey: "home" },
    { href: "/about", labelKey: "about" },
    { href: "/programs", labelKey: "programs" },
    { href: "/apply", labelKey: "apply" },
    { href: "/impact", labelKey: "impact" },
    { href: "/contact", labelKey: "contact" },
    { href: "/privacy", labelKey: "privacy" },
  ],
  adminNavigation: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/programs", label: "Programs" },
    { href: "/admin/applications", label: "Applications" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/activity", label: "Activity" },
    { href: "/admin/settings", label: "Settings" },
  ],
} as const;

export const adminNotice =
  "Área administrativa preparada a nivel de routing y layout. La autenticación llegará en una fase posterior con Auth.js.";
