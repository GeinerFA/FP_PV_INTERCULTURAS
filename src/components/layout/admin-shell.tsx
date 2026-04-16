import Link from "next/link";

import { adminNotice, siteConfig } from "@/config/site";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-slate-900/70 px-6 py-8">
          <Link href="/admin" className="text-xl font-semibold tracking-tight text-white">
            {siteConfig.adminName}
          </Link>
          <p className="mt-3 text-sm leading-6 text-slate-300">{adminNotice}</p>

          <nav className="mt-8 flex flex-col gap-2 text-sm">
            {siteConfig.adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="rounded-xl border border-teal-500/30 px-4 py-3 font-semibold text-teal-300 transition hover:bg-teal-500/10"
            >
              Login placeholder
            </Link>
          </nav>
        </aside>

        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
