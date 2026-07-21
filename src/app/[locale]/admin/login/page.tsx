import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { buildAdminGoogleAuthUrl, getAdminSession, sanitizeAdminNextPath } from "@/lib/admin-session";

type AdminLoginPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ error?: string; next?: string }>;
};

function getLoginErrorMessage(error: string | undefined): string | null {
  const messages = {
    access_denied: "access_denied",
    config: "config",
    oauth: "oauth",
    state: "state",
  } as const;

  if (!error || !(error in messages)) {
    return null;
  }

  return messages[error as keyof typeof messages];
}

export default async function AdminLoginPage({ params, searchParams }: AdminLoginPageProps) {
  const [{ locale }, resolvedSearchParams, session, t] = await Promise.all([
    params,
    searchParams,
    getAdminSession(),
    getTranslations("AdminLogin"),
  ]);

  const nextPath = sanitizeAdminNextPath(resolvedSearchParams.next, locale);

  if (session) {
    redirect(nextPath);
  }

  const errorKey = getLoginErrorMessage(resolvedSearchParams.error);

  if (!errorKey) {
    redirect(buildAdminGoogleAuthUrl(nextPath));
  }

  const loginHref = buildAdminGoogleAuthUrl(nextPath);
  const errorMessage = errorKey ? t(`errors.${errorKey}`) : null;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,244,232,0.84)_100%)] px-6 py-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.18)] md:px-8 md:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.72),transparent_62%)]"
      />

      <div className="relative max-w-3xl">
        <div className="mb-4 h-px w-20 bg-gradient-to-r from-emerald-700/70 to-transparent" />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t("description")}</p>
      </div>

      <div className="relative mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="surface-dark-panel rounded-3xl p-6 text-sm leading-6 text-slate-700">
          <p>{t("protectedNotice", { locale })}</p>
          <p className="mt-4 text-slate-500">{t("nextLabel", { nextPath })}</p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <a
            href={loginHref}
            className="admin-primary-action mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition"
          >
            {t("continueWithGoogle")}
          </a>
        </div>

        <div className="surface-dark-panel rounded-3xl p-6 text-sm leading-6 text-slate-700">
          <h2 className="text-base font-semibold text-slate-950">{t("rulesTitle")}</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {[t("rules.0"), t("rules.1"), t("rules.2")].map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
