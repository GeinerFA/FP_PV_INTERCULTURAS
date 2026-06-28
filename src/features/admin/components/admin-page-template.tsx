import { getTranslations } from "next-intl/server";

import type { AdminPageKey } from "@/features/admin/content/pages";

type AdminPageTemplateProps = {
  pageKey: AdminPageKey;
  children?: React.ReactNode;
};

export async function AdminPageTemplate({
  pageKey,
  children,
}: AdminPageTemplateProps) {
  const t = await getTranslations("AdminPages");
  const sections = t.raw(`${pageKey}.sections`) as string[];

  return (
    <section className="surface-dark-soft rounded-3xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {t(`${pageKey}.title`)}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
        {t(`${pageKey}.description`)}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <article
            key={section}
            className="surface-dark-panel rounded-2xl p-5 text-sm leading-6 text-slate-300"
          >
            {section}
          </article>
        ))}
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
