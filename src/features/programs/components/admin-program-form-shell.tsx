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

export function AdminProgramFormShell({ mode, program }: AdminProgramFormShellProps) {
  const isEdit = mode === "edit";

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-teal-500/20 bg-teal-500/10 p-6 text-sm leading-7 text-teal-50">
        <p className="font-semibold uppercase tracking-[0.18em] text-teal-200">
          {isEdit ? "Edit preparation" : "Create preparation"}
        </p>
        <p className="mt-3">
          {isEdit
            ? "This screen already loads the program entity from the shared service layer. Next iteration only needs real form state, submit actions and persistence."
            : "This screen mirrors the future program model so the CRUD form can land without redefining the domain contract."}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">Core identity</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { label: "Internal ID", value: program?.id ?? "Generated on save" },
                { label: "Slug", value: program?.slug ?? "future-program-slug" },
                { label: "Category", value: program?.category ?? "volunteer | internships | spanish-classes" },
                { label: "Status", value: program?.status ?? "draft" },
                { label: "Featured", value: String(program?.featured ?? false) },
                { label: "Cover image", value: program?.coverImage ?? "https://..." },
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
            <h2 className="text-lg font-semibold text-white">Localized presentation</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {(["es", "en"] as const).map((locale) => (
                <div key={locale} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {locale.toUpperCase()} translation
                  </p>
                  <div className="mt-4 space-y-4 text-sm text-slate-200">
                    <div>
                      <p className="font-semibold text-white">Title</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].title ?? getFieldValue(program, "Program title")}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Short description</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].shortDescription ??
                          getFieldValue(program, "Short description for cards and lists")}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Full description</p>
                      <p className="mt-1 text-slate-400">
                        {program?.translations[locale].fullDescription ??
                          getFieldValue(program, "Full long-form program description")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">Operational details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Location",
                  value: program ? `${program.location.es} / ${program.location.en}` : "Localized location",
                },
                {
                  label: "Duration",
                  value: program ? `${program.duration.es} / ${program.duration.en}` : "Localized duration",
                },
                {
                  label: "Availability",
                  value: program
                    ? `${program.availability.es} / ${program.availability.en}`
                    : "Localized availability",
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
            <h2 className="text-lg font-semibold text-white">Requirements</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {(program?.translations.es.requirements ?? [
                "Capture a structured list per locale.",
                "Reuse the shared validator before persistence exists.",
                "Keep compatibility with future form arrays.",
              ]).map((item) => (
                <li key={item} className="rounded-2xl bg-slate-900/70 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-lg font-semibold text-white">What is included</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {(program?.translations.es.included ?? [
                "Initial onboarding notes.",
                "Support details that will later sync to public detail pages.",
                "A future save action connected to MongoDB/Mongoose.",
              ]).map((item) => (
                <li key={item} className="rounded-2xl bg-slate-900/70 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm leading-7 text-slate-300">
            <h2 className="text-lg font-semibold text-white">SEO and audit preview</h2>
            <p className="mt-4">
              SEO titles/descriptions, createdBy, updatedBy and timestamps are already part of the entity.
              Persistence and auth can plug into these fields without reshaping the model.
            </p>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <p>Created by: {program?.createdBy ?? "future-auth-user"}</p>
              <p>Updated by: {program?.updatedBy ?? "future-auth-user"}</p>
              <p>Created at: {program?.createdAt ?? "auto-generated"}</p>
              <p>Updated at: {program?.updatedAt ?? "auto-generated"}</p>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
