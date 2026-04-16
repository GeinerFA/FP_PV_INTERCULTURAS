import { adminPageCopy, type AdminPageKey } from "@/features/admin/content/pages";

type AdminPageTemplateProps = {
  pageKey: AdminPageKey;
  children?: React.ReactNode;
};

export function AdminPageTemplate({
  pageKey,
  children,
}: AdminPageTemplateProps) {
  const page = adminPageCopy[pageKey];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
        {page.description}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {page.sections.map((section) => (
          <article
            key={section}
            className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm leading-6 text-slate-300"
          >
            {section}
          </article>
        ))}
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
