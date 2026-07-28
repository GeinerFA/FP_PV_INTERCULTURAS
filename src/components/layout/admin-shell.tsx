import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { AdminSidebarAccountControl } from "@/components/layout/admin-sidebar-account-control";
import { AdminSidebarNav } from "@/components/layout/admin-sidebar-nav";
import { Link } from "@/i18n/navigation";
import { buildAdminGoogleAuthUrl, type AdminSession } from "@/lib/admin-session";

type AdminShellProps = {
  children: React.ReactNode;
  session?: AdminSession | null;
};

export async function AdminShell({ children, session }: AdminShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminShell")]);
  const homePath = `/${locale}`;
  const adminHomePath = `/${locale}/admin`;
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.34),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_32%),linear-gradient(180deg,#eef8f1_0%,#f8f4e8_38%,#eff6f1_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-[116rem] gap-4 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6 xl:gap-8 xl:px-8 2xl:px-10">
        <aside className="admin-sidebar surface-dark-soft-strong flex min-h-0 flex-col gap-5 rounded-[34px] px-5 py-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:px-6 lg:py-6">
          <div className="relative z-20 flex items-center justify-between gap-3">
            <Link
              href="/"
              locale={locale}
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

            <AdminSidebarAccountControl
              loginHref={loginHref}
              logoutHref={logoutHref}
              labels={accountLabels}
              session={session}
            />
          </div>

          <div className="admin-sidebar-scroll flex min-h-0 flex-1 flex-col gap-8 lg:overflow-y-auto lg:pr-1">
            <div className="flex flex-col gap-5">
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
              {session ? <AdminSidebarNav labels={navigationLabels} /> : null}
            </div>
          </div>
        </aside>

        <main className="min-w-0 py-2 lg:py-4">
          <div className="flex max-w-none flex-col gap-4 xl:pr-2 2xl:pr-4">
            <div className="flex flex-col gap-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
