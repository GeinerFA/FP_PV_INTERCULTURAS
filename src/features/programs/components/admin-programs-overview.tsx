import Link from "next/link";

import { listAdminPrograms } from "@/services/programs/program-service";

const categoryLabel = {
  volunteer: "Volunteer",
  internships: "Internship",
  "spanish-classes": "Spanish classes",
} as const;

const statusTheme = {
  draft: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  published: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
} as const;

export async function AdminProgramsOverview() {
  const programs = await listAdminPrograms();
  const publishedCount = programs.filter((program) => program.status === "published").length;
  const featuredCount = programs.filter((program) => program.featured).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Catalog size
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{programs.length}</p>
          <p className="mt-2 text-sm text-slate-400">Single source of truth for admin and public routes.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Published now
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{publishedCount}</p>
          <p className="mt-2 text-sm text-slate-400">Only published items appear in the localized public catalog.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Featured highlights
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{featuredCount}</p>
          <p className="mt-2 text-sm text-slate-400">Prepared for curated promotion on marketing surfaces.</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Programs ready for future CRUD</h2>
            <p className="mt-2 text-sm text-slate-400">
              This view already reflects category, publication state, featured flag and edit entry points.
            </p>
          </div>
          <Link
            href="/admin/programs/new"
            className="inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            New program shell
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Featured</th>
                <th className="px-6 py-4 font-semibold">Availability</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {programs.map((program) => (
                <tr key={program.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-white">{program.translations.es.title}</p>
                    <p className="mt-1 text-xs text-slate-400">/{program.slug}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-400">
                      {program.translations.es.shortDescription}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate-200">{categoryLabel[program.category]}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                    >
                      {program.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-200">{program.featured ? "Yes" : "No"}</td>
                  <td className="px-6 py-5 text-slate-200">{program.availability.en}</td>
                  <td className="px-6 py-5">
                    <Link
                      href={`/admin/programs/${program.id}/edit`}
                      className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Open editor shell
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
