import { ThemeInit } from "../../.flowbite-react/init";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

import { siteConfig } from "@/config/site";
import { getSiteOrigin } from "@/config/site-origin";

// Google Search Console: código de la etiqueta HTML de verificación (opcional).
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  // Resolves canonical/hreflang/OpenGraph paths into absolute URLs.
  metadataBase: new URL(getSiteOrigin()),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Programas y experiencias interculturales con orientación clara para explorar oportunidades, postular y contactar a Pura Vida Interculturas.",
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
  icons: {
    icon: "/branding/logo-sin-fondo.png",
    shortcut: "/branding/logo-sin-fondo.png",
    apple: "/branding/logo-sin-fondo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
