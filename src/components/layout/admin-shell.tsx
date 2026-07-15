import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { AdminSession } from "@/lib/admin-session";

type AdminShellProps = {
  children: React.ReactNode;
  session?: AdminSession | null;
};

export async function AdminShell({ children, session }: AdminShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminShell")]);
  const adminHomePath = `/${locale}/admin`;
  const loginHref = `/api/admin/auth/google?next=${encodeURIComponent(adminHomePath)}`;
  const logoutHref = `/api/admin/auth/logout?next=${encodeURIComponent(adminHomePath)}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.34),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_32%),linear-gradient(180deg,#eef8f1_0%,#f8f4e8_38%,#eff6f1_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[88rem] gap-4 px-4 py-4 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="surface-dark-soft-strong flex h-full flex-col rounded-[32px] px-6 py-7 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              locale={locale}
              aria-label={t("homeLabel")}
              title={t("homeLabel")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/10 bg-white/72 text-slate-700 transition hover:border-emerald-600/30 hover:bg-emerald-50 hover:text-emerald-800"
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

            <div>
              <div className="mb-4 h-px w-20 bg-gradient-to-r from-emerald-700/70 to-transparent" />
              <Link href="/admin" className="inline-flex text-xl font-semibold tracking-tight text-slate-950">
                {siteConfig.adminName}
              </Link>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t("notice")}</p>
            </div>

            <div className="rounded-3xl border border-emerald-900/8 bg-white/66 p-4 text-sm text-slate-600 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)]">
              {session ? (
                <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/80">
                        {t("sessionActive")}
                      </p>
                      <p className="mt-2 break-all text-sm text-slate-900">{session.email}</p>
                    </div>
                  <form action={logoutHref} method="post">
                    <button
                      type="submit"
                      className="admin-danger-action inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 font-semibold transition"
                    >
                      {t("logout")}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-slate-600">
                    {t("loginNotice")}
                  </p>
                  <a
                    href={loginHref}
                    className="admin-primary-action inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 font-semibold transition"
                  >
                    {t("continueWithGoogle")}
                  </a>
                </div>
              )}
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-2 text-sm">
            {session
              ? siteConfig.adminNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-transparent px-4 py-3 text-slate-700 transition hover:border-emerald-900/10 hover:bg-white/56 hover:text-slate-950"
                  >
                    {t(`navigation.${item.labelKey}`)}
                  </Link>
                ))
              : null}
            {!session ? (
              <Link
                href="/admin/login"
                className="admin-secondary-action mt-2 rounded-2xl px-4 py-3 font-semibold transition"
              >
                {t("login")}
              </Link>
            ) : null}
          </nav>
        </aside>

        <main className="min-w-0 py-2 lg:py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
