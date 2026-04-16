"use client";

import { useLocale } from "next-intl";

import { locales } from "@/config/i18n";

export function LocaleSwitcher() {
  const currentLocale = useLocale();

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
      {locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <a
            key={locale}
            href={`/${locale}`}
            className={`rounded-full px-3 py-1 transition ${
              isActive ? "bg-white text-slate-900" : "text-white/80 hover:text-white"
            }`}
          >
            {locale}
          </a>
        );
      })}
    </div>
  );
}
