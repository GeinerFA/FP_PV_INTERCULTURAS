"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";

import { locales, type AppLocale } from "@/config/i18n";
import { Link, usePathname } from "@/i18n/navigation";

type PublicLanguageSwitcherProps = {
  label: string;
  localeNames: Record<AppLocale, string>;
};

/**
 * Switches the current page to another locale. Programs share one slug across locales, so the same
 * params work in every language; a program without a translation redirects back to Spanish.
 */
export function PublicLanguageSwitcher({ label, localeNames }: PublicLanguageSwitcherProps) {
  const activeLocale = useLocale() as AppLocale;
  const pathname = usePathname();
  const params = useParams();
  // The params always belong to the current route, so they match `pathname`.
  const href = { pathname, params } as unknown as ComponentProps<typeof Link>["href"];

  return (
    <nav aria-label={label} className="flex items-center rounded-full border border-white/85 bg-white/60 p-1 text-xs font-semibold">
      {locales.map((locale) => {
        const isActive = locale === activeLocale;

        return (
          <Link
            key={locale}
            href={href}
            locale={locale}
            hrefLang={locale}
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            title={localeNames[locale]}
            className={`rounded-full px-2.5 py-1.5 uppercase tracking-[0.14em] transition ${
              isActive ? "bg-emerald-800 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950"
            }`}
          >
            <span aria-hidden="true">{locale}</span>
            <span className="sr-only">{localeNames[locale]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
