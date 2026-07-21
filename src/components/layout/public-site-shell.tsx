import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { siteConfig } from "@/config/site";
import { buildAdminGoogleAuthUrl, getAdminSession } from "@/lib/admin-session";
import { PublicHeaderControls } from "./public-header-controls";
import { PublicNavbar } from "./public-navbar";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

export async function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [resolvedLocale, t, session] = await Promise.all([getLocale(), getTranslations(), getAdminSession()]);
  const locale = resolvedLocale as AppLocale;
  const homeHref = `/${locale}`;
  const adminHref = `/${locale}/admin`;
  const loginHref = buildAdminGoogleAuthUrl(adminHref);
  const logoutHref = `/api/admin/auth/logout?next=${encodeURIComponent(homeHref)}`;
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
    accountLoginAction: t("Shell.accountLoginAction"),
    accountSignedInHint: t("Shell.accountSignedInHint"),
    accountAdminAction: t("Shell.accountAdminAction"),
    accountLogoutAction: t("Shell.accountLogoutAction"),
  } as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.32),transparent_32%),linear-gradient(180deg,#eef8f1_0%,#f8f4e8_36%,#eff6f1_100%)] text-slate-900">
      <header className="sticky top-0 z-20 bg-white/42 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-6 py-3 md:flex-nowrap md:items-center md:gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <PublicNavbar locale={locale} navigationLabels={navigationLabels} />
          </div>
          <div className="shrink-0">
            <PublicHeaderControls
              adminHref={adminHref}
              loginHref={loginHref}
              logoutHref={logoutHref}
              labels={headerControlsLabels}
              session={session}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-14 px-6 py-10 md:py-12">
        {children}
      </main>

      <footer className="bg-white/18 backdrop-blur-sm">
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
