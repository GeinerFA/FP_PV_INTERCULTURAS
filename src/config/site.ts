export const siteConfig = {
  name: "Pura Vida Interculturas",
  adminName: "Pura Vida Interculturas Admin",
  description:
    "Programas y experiencias interculturales con orientación clara para explorar oportunidades, postular y contactar a Pura Vida Interculturas.",
  // Datos de contacto públicos (inicio y datos estructurados para buscadores).
  contact: {
    instagramUrl:
      "https://www.instagram.com/voluntariado_pvi?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    instagramProfileUrl: "https://www.instagram.com/voluntariado_pvi",
    whatsappNumber: "50689511665",
    phoneDisplay: "+506 8951 1665",
    locality: "San Ramón",
    region: "Alajuela",
    countryCode: "CR",
  },
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
