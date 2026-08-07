import { ThemeInit } from "../../.flowbite-react/init";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
