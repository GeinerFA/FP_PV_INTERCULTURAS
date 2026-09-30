"use client";

import Image from "next/image";

import { siteConfig } from "@/config/site";
import { Link as NextLink, usePathname } from "@/i18n/navigation";

import { usePublicHeader } from "./public-header";

type NavigationLabels = Record<(typeof siteConfig.publicNavigation)[number]["labelKey"] | "contact" | "admin", string>;

type PublicNavbarProps = {
  navigationLabels: NavigationLabels;
};

export function PublicNavbar({ navigationLabels }: PublicNavbarProps) {
  // Locale-less internal pathname ("/programs" on both / and /en).
  const normalizedPathname: string = usePathname();
  const { isTransparent, menuOpen: isOpen, setMenuOpen: setIsOpen } = usePublicHeader();

  const navItems = siteConfig.publicNavigation.filter((item) => item.href !== "/");

  return (
    <nav className="w-full" aria-label="Public navigation">
      <div className="flex flex-wrap items-center justify-between gap-4 xl:flex-nowrap xl:gap-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-4">
          <NextLink
            href="/"
            className="group inline-flex min-w-0 items-center rounded-2xl py-1 xl:pr-2 text-slate-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-200/80 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <Image
              src="/branding/nuevo-logo.png"
              alt={siteConfig.name}
              width={2420}
              height={778}
              className={`h-10 w-auto object-contain transition-[filter] duration-500 md:h-12 ${isTransparent ? "brightness-0 invert" : ""}`}
              priority
            />
          </NextLink>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="public-navbar-links"
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((current) => !current)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-emerald-200 xl:hidden ${
              isTransparent
                ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                : "bg-white/45 text-slate-700 hover:bg-white/65 hover:text-slate-950"
            }`}
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
          className={`${isOpen ? "flex" : "hidden"} w-full flex-col gap-2 text-sm xl:flex xl:min-w-0 xl:flex-1 xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end xl:gap-4 2xl:gap-5`}
        >
          {navItems.map((item) => {
            const href = item.href;
            const isActive = normalizedPathname === item.href;

            return (
              <NextLink
                key={item.href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`inline-flex items-center whitespace-nowrap py-1 text-sm font-medium transition ${
                  isActive
                    ? isTransparent
                      ? "text-white"
                      : "text-slate-950"
                    : isTransparent
                      ? "text-white/80 hover:text-white"
                      : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span className="nav-underline pb-0.5" data-active={isActive}>
                  {navigationLabels[item.labelKey]}
                </span>
              </NextLink>
            );
          })}

          <NextLink
            href={{ pathname: "/", hash: "contact" }}
            onClick={() => setIsOpen(false)}
            className={`inline-flex items-center whitespace-nowrap py-1 text-sm font-semibold transition ${
              isTransparent ? "text-emerald-300 hover:text-emerald-200" : "text-emerald-900 hover:text-emerald-700"
            }`}
          >
            <span className="border-b border-emerald-400/45 pb-0.5">{navigationLabels.contact}</span>
          </NextLink>
        </div>
      </div>
    </nav>
  );
}
