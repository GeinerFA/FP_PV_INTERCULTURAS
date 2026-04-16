import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Route not found</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          This route does not exist yet inside the current architectural base.
        </p>
        <Link
          href="/es"
          className="mt-8 inline-flex rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
        >
          Go to public site
        </Link>
      </div>
    </main>
  );
}
