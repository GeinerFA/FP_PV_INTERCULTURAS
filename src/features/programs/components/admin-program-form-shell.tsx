import { getLocale, getTranslations } from "next-intl/server";

import { locales, type AppLocale } from "@/config/i18n";
import type { Program } from "@/types/program";

type AdminProgramFormShellProps = {
  mode: "create" | "edit";
  program?: Program | null;
};

function getFieldValue(program: Program | null | undefined, field: string) {
  if (!program) {
    return field;
  }

  return field;
}

export async function AdminProgramFormShell({
  mode,
  program,
}: AdminProgramFormShellProps) {
  const isEdit = mode === "edit";
  const [t, locale] = await Promise.all([
    getTranslations("AdminProgramForm"),
    getLocale(),
  ]);
  const activeLocale = locale as AppLocale;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-teal-500/20 bg-teal-500/10 p-6 text-sm leading-7 text-teal-50">
        <p className="font-semibold uppercase tracking-[0.18em] text-teal-200">
          {isEdit ? t("mode.edit") : t("mode.create")}
        </p>
        <p className="mt-3">
          {isEdit
            ? t("intro.edit")
            : t("intro.create")}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.coreIdentity")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { label: t("fields.internalId"), value: program?.id ?? t("placeholders.generatedOnSave") },
                { label: t("fields.slug"), value: program?.slug ?? t("placeholders.futureSlug") },
                { label: t("fields.category"), value: program?.category ?? t("placeholders.categoryOptions") },
                { label: t("fields.status"), value: program?.status ?? "draft" },
                { label: t("fields.featured"), value: String(program?.featured ?? false) },
                { label: t("fields.coverImage"), value: program?.coverImage ?? "https://..." },
              ].map((field) => (
                <div key={field.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {field.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-100">{field.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.localizedPresentation")}</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {locales.map((locale) => (
                <div key={locale} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t("translationLocale", { locale: locale.toUpperCase() })}
                  </p>
                  <div className="mt-4 space-y-4 text-sm text-slate-200">
                    <div>
                      <p className="font-semibold text-white">{t("fields.title")}</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].title ?? getFieldValue(program, t("placeholders.programTitle"))}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t("fields.shortDescription")}</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].shortDescription ??
                          getFieldValue(program, t("placeholders.shortDescription"))}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t("fields.fullDescription")}</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].fullDescription ??
                          getFieldValue(program, t("placeholders.fullDescription"))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.operationalDetails")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: t("fields.location"),
                  value: program ? program.location[activeLocale] : t("placeholders.localizedLocation"),
                },
                {
                  label: t("fields.duration"),
                  value: program ? program.duration[activeLocale] : t("placeholders.localizedDuration"),
                },
                {
                  label: t("fields.availability"),
                  value: program ? program.availability[activeLocale] : t("placeholders.localizedAvailability"),
                },
              ].map((field) => (
                <div key={field.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {field.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-100">{field.value}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.requirements")}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {(program?.translations[activeLocale].requirements ?? [
                t("requirements.0"),
                t("requirements.1"),
                t("requirements.2"),
              ]).map((item) => (
                <li key={item} className="rounded-2xl bg-slate-900/70 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">{t("sections.included")}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {(program?.translations[activeLocale].included ?? [
                t("included.0"),
                t("included.1"),
                t("included.2"),
              ]).map((item) => (
                <li key={item} className="rounded-2xl bg-slate-900/70 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm leading-7 text-slate-300">
            <h2 className="text-lg font-semibold text-white">{t("sections.seoAuditPreview")}</h2>
            <p className="mt-4">{t("seoAuditDescription")}</p>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <p>{t("audit.createdBy")}: {program?.createdBy ?? t("placeholders.futureAuthUser")}</p>
              <p>{t("audit.updatedBy")}: {program?.updatedBy ?? t("placeholders.futureAuthUser")}</p>
              <p>{t("audit.createdAt")}: {program?.createdAt ?? t("placeholders.autoGenerated")}</p>
              <p>{t("audit.updatedAt")}: {program?.updatedAt ?? t("placeholders.autoGenerated")}</p>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
