import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

export async function PublicSiteShell({ children }: PublicSiteShellProps) {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{t("Shell.tagline")}</p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <LocaleSwitcher />
            <nav className="flex flex-wrap gap-4 text-sm text-slate-200">
              {siteConfig.publicNavigation.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {t(`Navigation.${item.labelKey}`)}
                </Link>
              ))}
              <Link href="/admin" className="font-semibold text-teal-300 hover:text-teal-200">
                {t("Navigation.admin")}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>{t("Shell.footer")}</p>
          <p>© 2026 {siteConfig.name}</p>
        </div>
      </footer>
    </div>
  );
}
