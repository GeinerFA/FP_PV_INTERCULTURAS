import { ThemeInit } from "../../.flowbite-react/init";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pura Vida Interculturas",
    template: "%s | Pura Vida Interculturas",
  },
  description:
    "Plataforma fullstack para presentar programas, captar voluntariado internacional y gestionar la operación administrativa.",
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
