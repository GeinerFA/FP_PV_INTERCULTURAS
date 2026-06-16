import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

function PersonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.314 0-6 2.239-6 5v1h12v-1c0-2.761-2.686-5-6-5Z" />
    </svg>
  );
}

export async function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const contactHref = `/${locale}#contact`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fcf8_0%,#fdfcf6_48%,#f7faf8_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950 transition hover:text-emerald-700">
              {siteConfig.name}
            </Link>

            <div className="flex items-center gap-3 self-start lg:self-auto">
              <LocaleSwitcher />
              <Link
                href="/admin"
                aria-label={t("Navigation.admin")}
                title={t("Navigation.admin")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
              >
                <span className="sr-only">{t("Navigation.admin")}</span>
                <PersonIcon />
              </Link>
            </div>
          </div>

          <div className="border-t border-emerald-100/70 pt-4">
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600 lg:justify-end">
              {siteConfig.publicNavigation.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-emerald-700">
                  {t(`Navigation.${item.labelKey}`)}
                </Link>
              ))}
              <NextLink href={contactHref} className="transition hover:text-emerald-700">
                {t("Navigation.contact")}
              </NextLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-emerald-100/80 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <p>{t("Shell.footer")}</p>
            <NextLink href={contactHref} className="mt-2 inline-flex font-semibold text-emerald-700 transition hover:text-emerald-600">
              {t("Shell.contactAction")}
            </NextLink>
          </div>
          <p>© 2026 {siteConfig.name}</p>
        </div>
      </footer>
    </div>
  );
}
