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
    <section className="rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.4)]">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
        {description}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight}
            className="rounded-2xl border border-emerald-200 bg-emerald-100/70 p-5 text-sm leading-6 text-slate-700"
          >
            {highlight}
          </article>
        ))}
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
