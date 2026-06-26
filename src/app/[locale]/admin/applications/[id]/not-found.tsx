import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function AdminApplicationNotFound() {
  const t = await getTranslations("ApplicationFlow.admin.notFound");

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{t("description")}</p>
      <Link
        href="/admin/applications"
        className="mt-8 inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
      >
        {t("backToList")}
      </Link>
    </section>
  );
}
