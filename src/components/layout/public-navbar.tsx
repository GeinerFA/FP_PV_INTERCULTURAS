"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, NavbarCollapse, NavbarToggle } from "flowbite-react";

import { siteConfig } from "@/config/site";

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

  const withoutLocale = pathname.replace(/^\/(es|en)(?=\/|$)/, "");

  return withoutLocale || "/";
}

export function PublicNavbar({ locale, navigationLabels }: PublicNavbarProps) {
  const pathname = usePathname();
  const normalizedPathname = getNormalizedPathname(pathname);
  const contactHref = `/${locale}#contact`;

  return (
    <Navbar
      fluid
      rounded
      className="rounded-3xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:px-5"
    >
      <NextLink href={`/${locale}`} className="flex items-center gap-3 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
          PV
        </div>
        <div>
          <span className="block text-base font-semibold tracking-tight text-slate-950 md:text-lg">{siteConfig.name}</span>
        </div>
      </NextLink>

      <div className="flex items-center md:order-2">
        <NavbarToggle className="rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-200 md:hidden" />
      </div>

      <NavbarCollapse className="mt-4 w-full border-t border-slate-100 pt-4 md:mt-0 md:border-0 md:pt-0">
        <div className="flex w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-1.5">
          {siteConfig.publicNavigation.filter((item) => item.href !== "/").map((item) => {
            const href = getLocalizedHref(locale, item.href);
            const isActive = normalizedPathname === item.href;

            return (
              <NextLink
                key={item.href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-950 ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {navigationLabels[item.labelKey]}
              </NextLink>
            );
          })}

          <NextLink
            href={contactHref}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {navigationLabels.contact}
          </NextLink>
        </div>
      </NavbarCollapse>
    </Navbar>
  );
}
