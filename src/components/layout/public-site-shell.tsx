import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buildAdminGoogleAuthUrl, getAdminSession } from "@/lib/admin-session";
import { PublicHeader } from "./public-header";
import { PublicHeaderControls } from "./public-header-controls";
import { PublicLanguageSwitcher } from "./public-language-switcher";
import { PublicNavbar } from "./public-navbar";
import { PublicScrollReveal } from "./public-scroll-reveal";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

export async function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [t, session] = await Promise.all([getTranslations(), getAdminSession()]);
  const homeHref = "/";
  const adminHref = "/admin";
  const loginHref = buildAdminGoogleAuthUrl(adminHref);
  const logoutHref = `/api/admin/auth/logout?next=${encodeURIComponent(homeHref)}`;
  const navigationLabels = {
    home: t("Navigation.home"),
    about: t("Navigation.about"),
    programs: t("Navigation.programs"),
    faqs: t("Navigation.faqs"),
    apply: t("Navigation.apply"),
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
      <PublicHeader>
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-6 py-3 md:flex-nowrap md:items-center md:gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <PublicNavbar navigationLabels={navigationLabels} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PublicLanguageSwitcher
              label={t("Shell.languageSwitcherLabel")}
              localeNames={{ es: t("Shell.localeNames.es"), en: t("Shell.localeNames.en") }}
            />
            <PublicHeaderControls
              adminHref={adminHref}
              loginHref={loginHref}
              logoutHref={logoutHref}
              labels={headerControlsLabels}
              session={session}
            />
          </div>
        </div>
      </PublicHeader>

      <main
        id="public-main"
        className="public-main-enter mx-auto flex max-w-6xl flex-1 flex-col gap-14 px-6 py-8 md:py-10 lg:py-12"
      >
        {children}
      </main>
      <PublicScrollReveal targetId="public-main" />

      <footer className="bg-white/18 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <p>{t("Shell.footer")}</p>
            <Link
              href={{ pathname: "/", hash: "contact" }}
              className="mt-2 inline-flex font-semibold text-emerald-800 transition hover:text-emerald-700"
            >
              {t("Shell.contactAction")}
            </Link>
          </div>
          <p>© 2026 {siteConfig.name}</p>
        </div>
      </footer>
    </div>
  );
}
