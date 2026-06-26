import { Link } from "@/i18n/navigation";

type PublicApplicationSuccessProps = {
  badgeLabel: string;
  title: string;
  description: string;
  nextStepsTitle: string;
  nextSteps: string[];
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

export function PublicApplicationSuccess({
  badgeLabel,
  title,
  description,
  nextStepsTitle,
  nextSteps,
  primaryActionLabel,
  secondaryActionLabel,
}: PublicApplicationSuccessProps) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900">
          {badgeLabel}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="text-base leading-7 text-slate-700">{description}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {nextStepsTitle}
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {nextSteps.map((step) => (
              <li key={step} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500/70" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link
            href="/programs"
            className="inline-flex items-center rounded-full border border-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-950"
          >
            {secondaryActionLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {primaryActionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
