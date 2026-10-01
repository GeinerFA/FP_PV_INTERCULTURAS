import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import {
  AdminMobileMenuButton,
  AdminMobileMenuPanel,
  AdminMobileMenuProvider,
} from "@/components/layout/admin-mobile-menu";
import { AdminMobileAccountSummary, AdminSidebarAccountControl } from "@/components/layout/admin-sidebar-account-control";
import { AdminSidebarNav } from "@/components/layout/admin-sidebar-nav";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { Link } from "@/i18n/navigation";
import { buildAdminGoogleAuthUrl, canAccessAdminNavigationItem, type AdminSession } from "@/lib/admin-session";

type AdminShellProps = {
  children: React.ReactNode;
  session?: AdminSession | null;
};

export async function AdminShell({ children, session }: AdminShellProps) {
  const t = await getTranslations("AdminShell");
  const homePath = "/";
  const adminHomePath = "/admin";
  const loginHref = buildAdminGoogleAuthUrl(adminHomePath);
  const logoutHref = `/api/admin/auth/logout?next=${encodeURIComponent(homePath)}`;
  const accountLabels = {
    accountMenuLabel: t("accountMenuLabel"),
    accountMenuTitle: t("accountMenuTitle"),
    accountMenuDescription: t("accountMenuDescription"),
    accountLoginAction: t("continueWithGoogle"),
    accountLogoutAction: t("logout"),
    sessionActive: t("sessionActive"),
  } as const;
  const navigationLabels = {
    dashboard: t("navigation.dashboard"),
    programs: t("navigation.programs"),
    applications: t("navigation.applications"),
    activity: t("navigation.activity"),
    settings: t("navigation.settings"),
  } as const;
  const visibleNavigationItems = session
    ? siteConfig.adminNavigation.filter((item) => canAccessAdminNavigationItem(session, item.href))
    : [];

  return (
    <div className="admin-shell-preview min-h-screen text-slate-900 lg:h-screen lg:overflow-hidden">
      <div aria-hidden="true" className="admin-shell-preview-background" />
      <div aria-hidden="true" className="admin-shell-preview-overlay" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[116rem] gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6 xl:gap-8 xl:px-8 2xl:px-10">
        <AdminMobileMenuProvider>
          <aside className="admin-sidebar surface-dark-soft-strong flex min-h-0 flex-col gap-5 rounded-[26px] px-4 py-4 sm:rounded-[34px] sm:px-5 sm:py-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:px-6 lg:py-6">
            <div className="relative z-20 flex items-center justify-between gap-3">
              <Link
                href="/"
                aria-label={t("homeLabel")}
                title={t("homeLabel")}
                className="admin-sidebar-home-link inline-flex h-11 w-11 items-center justify-center rounded-full"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 10.75L12 3l9 7.75" />
                  <path d="M5.25 9.75V21h13.5V9.75" />
                  <path d="M9.75 21v-6.75h4.5V21" />
                </svg>
                <span className="sr-only">{t("homeLabel")}</span>
              </Link>

              <Link href="/admin" className="flex min-w-0 flex-1 justify-center md:hidden">
                <Image
                  src="/branding/nuevo-logo.png"
                  alt={siteConfig.name}
                  width={2420}
                  height={778}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </Link>

              <div className="flex items-center gap-2">
                <div className={session ? "hidden md:block" : undefined}>
                  <AdminSidebarAccountControl
                    loginHref={loginHref}
                    logoutHref={logoutHref}
                    labels={accountLabels}
                    session={session}
                  />
                </div>
                {session ? <AdminMobileMenuButton label={t("menuLabel")} /> : null}
              </div>
            </div>

            <AdminMobileMenuPanel className="admin-sidebar-scroll min-h-0 flex-1 flex-col gap-8 lg:overflow-y-auto lg:pr-1">
              <div className="hidden flex-col gap-5 md:flex">
                <div className="admin-sidebar-brand-panel rounded-[30px] p-5">
                  <Link href="/admin" className="flex flex-col gap-4 text-slate-950 transition hover:opacity-95">
                    <div className="flex items-center gap-3">
                      <div className="admin-sidebar-logo-wrap flex h-14 w-14 items-center justify-center rounded-2xl p-2">
                        <Image
                          src="/branding/logo-sin-fondo.png"
                          alt={siteConfig.name}
                          width={256}
                          height={256}
                          className="h-10 w-10 object-contain"
                          priority
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-semibold tracking-tight text-slate-950">{siteConfig.name}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-6">
                {session ? (
                  <AdminMobileAccountSummary logoutHref={logoutHref} labels={accountLabels} session={session} />
                ) : null}
                {session ? <AdminSidebarNav items={visibleNavigationItems} labels={navigationLabels} /> : null}
              </div>
            </AdminMobileMenuPanel>
          </aside>
        </AdminMobileMenuProvider>

        <main id="admin-main" className="min-w-0 py-2 lg:min-h-0 lg:overflow-y-auto lg:py-4">
          <div className="flex max-w-none flex-col gap-4 lg:min-h-full xl:pr-2 2xl:pr-4">
            <div className="flex flex-col gap-6">{children}</div>
          </div>
        </main>
      </div>

      {/* On desktop <main> is the scroll container; on mobile the window scrolls. */}
      <ScrollToTopButton label={t("backToTop")} scrollContainerId="admin-main" />
    </div>
  );
}
