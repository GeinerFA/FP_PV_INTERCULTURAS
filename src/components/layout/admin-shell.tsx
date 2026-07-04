import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

export async function AdminShell({ children }: AdminShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminShell")]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[88rem] gap-4 px-4 py-4 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="surface-dark-soft flex h-full flex-col rounded-[32px] border border-white/10 px-6 py-7 shadow-[0_24px_80px_-48px_rgba(15,23,42,1)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              locale={locale}
              aria-label={t("homeLabel")}
              title={t("homeLabel")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-100 transition hover:border-teal-400 hover:bg-teal-500/10 hover:text-teal-200"
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
              <div className="mb-4 h-px w-20 bg-gradient-to-r from-teal-300/80 to-transparent" />
              <Link href="/admin" className="inline-flex text-xl font-semibold tracking-tight text-white">
                {siteConfig.adminName}
              </Link>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t("notice")}</p>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-2 text-sm">
            {siteConfig.adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-transparent px-4 py-3 text-slate-200 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                {t(`navigation.${item.labelKey}`)}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="mt-2 rounded-2xl border border-teal-500/30 px-4 py-3 font-semibold text-teal-300 transition hover:bg-teal-500/10"
            >
              {t("login")}
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 py-2 lg:py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
