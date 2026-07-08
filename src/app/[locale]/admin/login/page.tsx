import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";
import { getAdminSession, sanitizeAdminNextPath } from "@/lib/admin-session";

type AdminLoginPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ error?: string; next?: string }>;
};

function getLoginErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "access_denied":
      return "La cuenta de Google no está autorizada para ingresar al panel.";
    case "config":
      return "Falta completar la configuración administrativa antes de iniciar sesión.";
    case "oauth":
      return "No se pudo completar el acceso con Google. Intentá nuevamente.";
    case "state":
      return "La validación del inicio de sesión expiró. Volvé a intentarlo.";
    default:
      return null;
  }
}

export default async function AdminLoginPage({ params, searchParams }: AdminLoginPageProps) {
  const [{ locale }, resolvedSearchParams, session] = await Promise.all([
    params,
    searchParams,
    getAdminSession(),
  ]);

  const nextPath = sanitizeAdminNextPath(resolvedSearchParams.next, locale);

  if (session) {
    redirect(nextPath);
  }

  const loginHref = `/api/admin/auth/google?next=${encodeURIComponent(nextPath)}`;
  const errorMessage = getLoginErrorMessage(resolvedSearchParams.error);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.88)_100%)] px-6 py-6 shadow-[0_30px_80px_-45px_rgba(8,145,178,0.55)] md:px-8 md:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_62%)]"
      />

      <div className="relative max-w-3xl">
        <div className="mb-4 h-px w-20 bg-gradient-to-r from-teal-300/80 to-transparent" />
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Acceso administrativo
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
          Ingresá con la cuenta de Google autorizada para abrir el espacio administrativo.
        </p>
      </div>

      <div className="relative mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="surface-dark-panel rounded-3xl border border-white/10 p-6 text-sm leading-6 text-slate-300">
          <p>
            El acceso protege todo <strong className="text-white">/{locale}/admin</strong> y te devuelve
            a la ruta solicitada después de validar la sesión.
          </p>
          <p className="mt-4 text-slate-400">Destino después de iniciar sesión: {nextPath}</p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-100">
              {errorMessage}
            </div>
          ) : null}
          <a
            href={loginHref}
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-teal-400/40 bg-teal-500/10 px-5 py-3 font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-500/20"
          >
            Continuar con Google
          </a>
        </div>

        <div className="surface-dark-panel rounded-3xl border border-white/10 p-6 text-sm leading-6 text-slate-300">
          <h2 className="text-base font-semibold text-white">Reglas del acceso</h2>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li>• Solo entra la cuenta configurada como administradora.</li>
            <li>• Google debe devolver el correo como verificado.</li>
            <li>• Las rutas públicas siguen visibles sin autenticación.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
