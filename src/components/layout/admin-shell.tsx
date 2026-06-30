import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

export async function AdminShell({ children }: AdminShellProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("AdminShell")]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-slate-900/70 px-6 py-8">
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
              <Link href="/admin" className="text-xl font-semibold tracking-tight text-white">
                {siteConfig.adminName}
              </Link>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t("notice")}</p>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-2 text-sm">
            {siteConfig.adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                {t(`navigation.${item.labelKey}`)}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="rounded-xl border border-teal-500/30 px-4 py-3 font-semibold text-teal-300 transition hover:bg-teal-500/10"
            >
              {t("login")}
            </Link>
          </nav>
        </aside>

        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
