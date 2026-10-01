import type { AppLocale } from "@/config/i18n";
import { siteConfig } from "@/config/site";
import { getSiteOrigin } from "@/config/site-origin";
import { getPathname } from "@/i18n/navigation";

type SiteStructuredDataProps = {
  locale: AppLocale;
  description: string;
};

/**
 * Datos estructurados (JSON-LD de schema.org) del sitio oficial: le indican a Google el nombre
 * de la organización, su sitio, logo, ubicación y redes. Va en la página de inicio.
 */
export function SiteStructuredData({ locale, description }: SiteStructuredDataProps) {
  const origin = getSiteOrigin();
  const homeUrl = `${origin}${getPathname({ href: "/", locale })}`;
  const organizationId = `${origin}/#organization`;
  const { contact } = siteConfig;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: `${origin}/`,
        logo: `${origin}/branding/logo-sin-fondo.png`,
        image: `${origin}/branding/nuevo-logo.png`,
        description,
        address: {
          "@type": "PostalAddress",
          addressLocality: contact.locality,
          addressRegion: contact.region,
          addressCountry: contact.countryCode,
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: contact.phoneDisplay,
          contactType: "customer service",
          availableLanguage: ["Spanish", "English"],
        },
        sameAs: [contact.instagramProfileUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: siteConfig.name,
        url: homeUrl,
        inLanguage: locale === "en" ? "en" : "es",
        publisher: { "@id": organizationId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON escapado: "<" como < para que ningún texto pueda cerrar la etiqueta <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
