type PageCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children?: React.ReactNode;
};

export function PageCard({
  eyebrow,
  title,
  description,
  highlights,
  children,
}: PageCardProps) {
  return (
    <section className="space-y-8 md:space-y-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
        {description}
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article key={highlight} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500/70" />
            <span>{highlight}</span>
          </article>
        ))}
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
