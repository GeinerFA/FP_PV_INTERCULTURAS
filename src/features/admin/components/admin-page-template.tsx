import { getTranslations } from "next-intl/server";

import type { AdminPageKey } from "@/features/admin/content/pages";

type AdminPageTemplateProps = {
  pageKey: AdminPageKey;
  variant?: "workspace" | "placeholder";
  useInnerWorkspace?: boolean;
  headerAction?: React.ReactNode;
  sections?: string[];
  children?: React.ReactNode;
};

export async function AdminPageTemplate({
  pageKey,
  variant = "placeholder",
  useInnerWorkspace = false,
  headerAction,
  sections,
  children,
}: AdminPageTemplateProps) {
  const t = await getTranslations("AdminPages");
  const isWorkspace = variant === "workspace";
  const translatedSections = isWorkspace ? [] : ((t.raw(`${pageKey}.sections`) as string[]) ?? []);
  const resolvedSections = sections ?? translatedSections;

  return (
    <section
        className={`relative overflow-hidden rounded-[32px] border border-white/10 ${
          isWorkspace
            ? "bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.92)_100%)] px-6 py-6 shadow-[0_34px_88px_-48px_rgba(2,6,23,0.92)] md:px-8 md:py-8"
            : "surface-dark-soft p-8"
        }`}
    >
      {isWorkspace ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_62%)]"
        />
      ) : null}

      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 h-px w-20 bg-gradient-to-r from-teal-300/80 to-transparent" />
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t(`${pageKey}.title`)}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
            {t(`${pageKey}.description`)}
          </p>
        </div>
        {headerAction ? (
          <div className="md:shrink-0 md:self-center">{headerAction}</div>
        ) : null}
      </div>

      {resolvedSections.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {resolvedSections.map((section) => (
            <article
              key={section}
              className="surface-dark-panel rounded-2xl p-5 text-sm leading-6 text-slate-300"
            >
              {section}
            </article>
          ))}
        </div>
      ) : null}

      {children ? (
        <div className={`relative mt-10 ${useInnerWorkspace ? "admin-inner-workspace" : ""}`.trim()}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
