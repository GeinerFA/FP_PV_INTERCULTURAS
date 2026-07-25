"use client";

import { usePathname } from "next/navigation";

import { locales } from "@/config/i18n";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

type AdminSidebarNavProps = {
  labels: Record<(typeof siteConfig.adminNavigation)[number]["labelKey"], string>;
};

const localePrefixPattern = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

function getNormalizedPathname(pathname: string | null) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withoutLocale = pathname.replace(localePrefixPattern, "");

  return withoutLocale || "/";
}

function isItemActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationIcon({ itemHref, active }: { itemHref: string; active: boolean }) {
  const iconClassName = active ? "text-emerald-50" : "text-emerald-900/72";

  if (itemHref === "/admin/programs") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 ${iconClassName}`}>
        <rect x="4.25" y="5" width="15.5" height="14" rx="3" />
        <path d="M8 9h8" />
        <path d="M8 12.5h8" />
        <path d="M8 16h4.5" />
      </svg>
    );
  }

  if (itemHref === "/admin/applications") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 ${iconClassName}`}>
        <path d="M8 4.75h8" />
        <path d="M12 4.75v14.5" />
        <path d="M6.25 8.25h11.5" />
        <rect x="4.25" y="4.25" width="15.5" height="15.5" rx="3.25" />
      </svg>
    );
  }

  if (itemHref === "/admin/activity") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 ${iconClassName}`}>
        <path d="M4 12h3.25l2.25-4.25 4.25 8.5L16 12h4" />
        <path d="M4.5 6.5h15" />
        <path d="M4.5 17.5h15" />
      </svg>
    );
  }

  if (itemHref === "/admin/settings") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 ${iconClassName}`}>
        <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8 0 2 2 0 0 1 0-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 0-2.8 2 2 0 0 1 2.8 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 ${iconClassName}`}>
      <path d="M3.75 12.25 12 4.5l8.25 7.75" />
      <path d="M6.5 10.75V19.5h11v-8.75" />
      <path d="M10 19.5v-4.75h4v4.75" />
    </svg>
  );
}

export function AdminSidebarNav({ labels }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const normalizedPathname = getNormalizedPathname(pathname);

  return (
    <nav className="flex flex-col gap-2 text-sm" aria-label="Admin navigation">
      {siteConfig.adminNavigation.map((item) => {
        const isActive = isItemActive(normalizedPathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`admin-sidebar-nav-link ${isActive ? "admin-sidebar-nav-link-active" : ""}`}
          >
            <span className={`admin-sidebar-nav-icon ${isActive ? "admin-sidebar-nav-icon-active" : ""}`}>
              <NavigationIcon itemHref={item.href} active={isActive} />
            </span>
            <span className="min-w-0 flex-1 truncate">{labels[item.labelKey]}</span>
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full transition ${isActive ? "bg-emerald-100 shadow-[0_0_0_6px_rgba(236,253,245,0.14)]" : "bg-emerald-900/10"}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
