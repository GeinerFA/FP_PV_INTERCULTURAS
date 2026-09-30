import { ThemeInit } from "../../.flowbite-react/init";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

function resolveMetadataBase(): URL | undefined {
  try {
    return process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN) : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  // Resolves canonical/hreflang/OpenGraph paths into absolute URLs.
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Pura Vida Interculturas",
    template: "%s | Pura Vida Interculturas",
  },
  description:
    "Programas y experiencias interculturales con orientación clara para explorar oportunidades, postular y contactar a Pura Vida Interculturas.",
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
