"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import { locales } from "@/config/i18n";

function getLocalizedPathname(pathname: string, locale: string, hash = "") {
  if (!pathname || pathname === "/") {
    return `/${locale}${hash}`;
  }

  const nextPathname = pathname.replace(/^\/(es|en)(?=\/|$)/, "");

  return `/${locale}${nextPathname || ""}${hash}`;
}

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={getLocalizedPathname(pathname, locale, hash)}
            className={`rounded-full px-3 py-1 transition ${
              isActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
             }`}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
