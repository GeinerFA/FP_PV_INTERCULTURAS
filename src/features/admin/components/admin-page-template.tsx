import { getTranslations } from "next-intl/server";

import type { AdminPageKey } from "@/features/admin/content/pages";

type AdminPageTemplateProps = {
  pageKey: AdminPageKey;
  variant?: "workspace" | "placeholder";
  useInnerWorkspace?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
  sections?: string[];
  children?: React.ReactNode;
};

export async function AdminPageTemplate({
  pageKey,
  variant = "placeholder",
  useInnerWorkspace = false,
  className,
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
      className={`relative overflow-hidden rounded-[24px] border border-white/70 sm:rounded-[32px] ${
        isWorkspace
          ? "admin-workspace-page px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 xl:px-10 xl:py-9"
          : "surface-dark-soft p-5 sm:p-8"
      } ${className ?? ""}`.trim()}
    >
      {isWorkspace ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.7),transparent_62%)]"
        />
      ) : null}

      <div className="relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-4xl xl:max-w-5xl">
          <div className="mb-4 h-px w-20 bg-gradient-to-r from-emerald-700/70 to-transparent" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
            {t(`${pageKey}.title`)}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7 md:text-lg">
            {t(`${pageKey}.description`)}
          </p>
        </div>
        {headerAction ? (
          <div className="lg:shrink-0 lg:self-center">{headerAction}</div>
        ) : null}
      </div>

      {resolvedSections.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {resolvedSections.map((section) => (
            <article
              key={section}
              className="surface-dark-panel rounded-2xl p-5 text-sm leading-6 text-slate-700"
            >
              {section}
            </article>
          ))}
        </div>
      ) : null}

      {children ? (
        <div className={`relative mt-6 min-w-0 sm:mt-10 ${useInnerWorkspace ? "admin-inner-workspace" : ""}`.trim()}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
