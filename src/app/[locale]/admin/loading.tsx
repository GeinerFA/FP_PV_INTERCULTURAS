import { getTranslations } from "next-intl/server";

/** Shown instantly while an admin page loads its data, so navigation never feels frozen. */
export default async function AdminLoading() {
  const t = await getTranslations("AdminShell");

  return (
    <section
      role="status"
      aria-live="polite"
      className="admin-workspace-page admin-loading relative overflow-hidden rounded-[32px] border border-white/70 px-6 py-6 md:px-8 md:py-8 xl:px-10 xl:py-9"
    >
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden="true" className="space-y-8">
        <div className="space-y-4">
          <div className="admin-skeleton h-px w-20" />
          <div className="admin-skeleton h-9 w-72 max-w-full rounded-2xl" />
          <div className="admin-skeleton h-5 w-[32rem] max-w-full rounded-xl" />
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="admin-skeleton h-28 rounded-[28px]" />
          ))}
        </div>
        <div className="admin-skeleton h-72 rounded-[28px]" />
      </div>
    </section>
  );
}
