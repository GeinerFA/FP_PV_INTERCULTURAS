"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { locales } from "@/config/i18n";

function getLocalizedPathname(pathname: string, locale: string) {
  if (!pathname || pathname === "/") {
    return `/${locale}`;
  }

  const nextPathname = pathname.replace(/^\/(es|en)(?=\/|$)/, "");

  return `/${locale}${nextPathname || ""}`;
}

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 p-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm backdrop-blur">
      {locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={getLocalizedPathname(pathname, locale)}
            className={`rounded-full px-3 py-1 transition ${
              isActive
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-emerald-700"
            }`}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
