import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { PublicHeaderControls } from "./public-header-controls";
import { PublicNavbar } from "./public-navbar";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

export async function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const contactHref = `/${locale}#contact`;
  const navigationLabels = {
    home: t("Navigation.home"),
    about: t("Navigation.about"),
    programs: t("Navigation.programs"),
    faqs: t("Navigation.faqs"),
    apply: t("Navigation.apply"),
    impact: t("Navigation.impact"),
    privacy: t("Navigation.privacy"),
    contact: t("Navigation.contact"),
    admin: t("Navigation.admin"),
  } as const;
  const headerControlsLabels = {
    accountMenuLabel: t("Shell.accountMenuLabel"),
    accountMenuTitle: t("Shell.accountMenuTitle"),
    accountMenuDescription: t("Shell.accountMenuDescription"),
    accountDashboard: t("Shell.accountDashboard"),
    accountSettings: t("Shell.accountSettings"),
    accountChangePasswordFuture: t("Shell.accountChangePasswordFuture"),
    accountSignOutFuture: t("Shell.accountSignOutFuture"),
    futureActionBadge: t("Shell.futureActionBadge"),
  } as const;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf7f0_0%,#f7f4e8_48%,#eff5f1_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="mb-3 flex justify-end">
            <PublicHeaderControls locale={locale} labels={headerControlsLabels} />
          </div>

          <PublicNavbar locale={locale} navigationLabels={navigationLabels} />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-emerald-200/80 bg-emerald-50/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <p>{t("Shell.footer")}</p>
            <NextLink href={contactHref} className="mt-2 inline-flex font-semibold text-emerald-800 transition hover:text-emerald-700">
              {t("Shell.contactAction")}
            </NextLink>
          </div>
          <p>© 2026 {siteConfig.name}</p>
        </div>
      </footer>
    </div>
  );
}
