import { getMessages } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";

type PublicImpactMessages = {
  eyebrow: string;
  title: string;
  description: string;
  story: {
    eyebrow: string;
    title: string;
    description: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    description: string;
    entries: Record<
      string,
      {
        quote: string;
        name: string;
        role: string;
      }
    >;
  };
  gallery: {
    eyebrow: string;
    title: string;
    description: string;
    items: Record<
      string,
      {
        title: string;
        caption: string;
        alt: string;
        accent: string;
      }
    >;
  };
  principles: {
    eyebrow: string;
    title: string;
    items: Record<string, string>;
  };
};

type PublicImpactPageProps = {
  locale: AppLocale;
};

const galleryAccentClassName: Record<string, string> = {
  emerald: "from-emerald-200 via-emerald-100 to-white",
  amber: "from-amber-200 via-amber-100 to-white",
  sky: "from-sky-200 via-sky-100 to-white",
};

export async function PublicImpactPage({ locale }: PublicImpactPageProps) {
  const messages = await getMessages();
  const impact = (messages.Pages as { impact: PublicImpactMessages }).impact;
  const testimonials = Object.entries(impact.testimonials.entries);
  const galleryItems = Object.entries(impact.gallery.items);
  const principles = Object.entries(impact.principles.items);

  return (
    <div lang={locale} className="space-y-14">
      <section className="animate-fade-up grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-800">
            {impact.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {impact.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{impact.description}</p>
        </div>

        <article className="border-l border-emerald-200/70 pl-6 text-sm leading-7 text-slate-600 lg:pb-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {impact.story.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{impact.story.title}</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{impact.story.description}</p>
        </article>
      </section>

      <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {impact.testimonials.eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {impact.testimonials.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {impact.testimonials.description}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-3">
          {testimonials.map(([key, testimonial], index) => (
            <article key={key} className={`border-t border-slate-200 pt-6 ${index === 0 ? "lg:col-span-2" : ""}`}>
              <p className="text-lg leading-8 text-slate-700">“{testimonial.quote}”</p>
              <footer className="mt-6 border-l border-emerald-200/70 pl-4">
                <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                <p className="mt-1 text-sm text-slate-500">{testimonial.role}</p>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up" style={{ animationDelay: "140ms" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {impact.gallery.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{impact.gallery.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{impact.gallery.description}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {galleryItems.map(([key, item]) => (
            <article key={key} className="overflow-hidden rounded-[1.9rem] bg-white/70 ring-1 ring-slate-200/80">
              <div
                role="img"
                aria-label={item.alt}
                className={`h-48 bg-gradient-to-br ${galleryAccentClassName[item.accent] ?? galleryAccentClassName.emerald}`}
              />
              <div className="px-5 py-5">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="animate-fade-up rounded-[2rem] bg-[linear-gradient(135deg,rgba(248,251,248,0.56)_0%,rgba(223,243,231,0.4)_52%,rgba(246,223,173,0.3)_100%)] px-6 py-8 md:px-8 md:py-10"
        style={{ animationDelay: "200ms" }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {impact.principles.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {impact.principles.title}
        </h2>

        <div className="mt-8 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {principles.map(([key, principle], index) => (
            <article key={key} className="relative pl-5 text-sm leading-7 text-slate-700">
              <span
                aria-hidden="true"
                className={`absolute left-0 top-2 h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500/70" : "bg-amber-400/80"}`}
              />
              {principle}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
