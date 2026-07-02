"use client";

import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { locales } from "@/config/i18n";
import { siteConfig } from "@/config/site";

const localePrefixPattern = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

type NavigationLabels = Record<(typeof siteConfig.publicNavigation)[number]["labelKey"] | "contact" | "admin", string>;

type PublicNavbarProps = {
  locale: string;
  navigationLabels: NavigationLabels;
};

function getLocalizedHref(locale: string, href: string) {
  if (href === "/") {
    return `/${locale}`;
  }

  return `/${locale}${href}`;
}

function getNormalizedPathname(pathname: string | null) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withoutLocale = pathname.replace(localePrefixPattern, "");

  return withoutLocale || "/";
}

export function PublicNavbar({ locale, navigationLabels }: PublicNavbarProps) {
  const pathname = usePathname();
  const normalizedPathname = getNormalizedPathname(pathname);
  const contactHref = `/${locale}#contact`;
  const [isOpen, setIsOpen] = useState(false);

  const navItems = siteConfig.publicNavigation.filter((item) => item.href !== "/");

  return (
    <nav className="w-full" aria-label="Public navigation">
      <div className="flex flex-wrap items-center justify-between gap-4 md:flex-nowrap md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <NextLink
            href={`/${locale}`}
            className="group inline-flex min-w-0 items-center rounded-2xl py-1 text-slate-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-200/80 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <Image
              src="/branding/nuevo-logo.png"
              alt={siteConfig.name}
              width={2420}
              height={778}
              className="h-11 w-auto object-contain md:h-14"
              priority
            />
          </NextLink>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="public-navbar-links"
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-slate-700 transition hover:bg-white/65 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
        </div>

        <div
          id="public-navbar-links"
          className={`${isOpen ? "flex" : "hidden"} w-full flex-col gap-2 text-sm md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-5`}
        >
          {navItems.map((item) => {
            const href = getLocalizedHref(locale, item.href);
            const isActive = normalizedPathname === item.href;

            return (
              <NextLink
                key={item.href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`inline-flex items-center py-1 text-sm font-medium transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span className={isActive ? "border-b border-emerald-500/60 pb-0.5" : "pb-0.5"}>
                  {navigationLabels[item.labelKey]}
                </span>
              </NextLink>
            );
          })}

          <NextLink
            href={contactHref}
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center py-1 text-sm font-semibold text-emerald-900 transition hover:text-emerald-700"
          >
            <span className="border-b border-emerald-400/45 pb-0.5">{navigationLabels.contact}</span>
          </NextLink>
        </div>
      </div>
    </nav>
  );
}
