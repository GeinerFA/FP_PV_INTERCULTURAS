import { getLocale, getTranslations } from "next-intl/server";

import { archiveProgramAction, reactivateProgramAction } from "@/app/[locale]/admin/programs/actions";
import type { AppLocale } from "@/config/i18n";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { ADMIN_LIST_PAGE_SIZE, buildPaginationState, paginateItems } from "@/features/admin/lib/pagination";
import { getProgramCategoryName } from "@/features/programs/lib/program-category-presentation";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { Link } from "@/i18n/navigation";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";
import { listAdminPrograms } from "@/services/programs/program-service";

const statusTheme = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

const programRowActionBaseClassName =
  "inline-flex min-w-[10.5rem] items-center justify-center rounded-full px-4 py-2.5 text-[0.8125rem] font-semibold transition";

const programRowActionLinkClassName = `admin-outline-action ${programRowActionBaseClassName}`;
const programRowActionInfoClassName = `admin-info-action ${programRowActionBaseClassName}`;
const programRowActionFormClassName = "max-w-xs min-w-[10.5rem]";

type AdminProgramsOverviewProps = {
  feedback?:
    | "archived"
    | "deleted"
    | "destructive-confirmation-required"
    | "draft-saved"
    | "published"
    | "reactivated";
  view?: "archived";
  page: number;
  session: AdminSession;
};

export async function AdminProgramsOverview({ feedback, view, page, session }: AdminProgramsOverviewProps) {
  const [t, locale] = await Promise.all([getTranslations("AdminProgramsOverview"), getLocale()]);

  let programs: Awaited<ReturnType<typeof listAdminPrograms>>;

  try {
    programs = await listAdminPrograms();
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection
        eyebrow={t("unavailable.eyebrow")}
        title={t("unavailable.title")}
        description={t("unavailable.description")}
        tone="warning"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("unavailable.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const activeLocale = locale as AppLocale;
  const canManage = hasAdminPermission(session, "programs.manage");
  const canDelete = hasAdminPermission(session, "programs.delete");
  const isArchivedView = view === "archived";
  const filteredPrograms = programs.filter((program) =>
    isArchivedView ? program.status === "archived" : program.status === "published" || program.status === "draft",
  );
  const pagination = buildPaginationState({
    currentPage: page,
    totalItems: filteredPrograms.length,
    pageSize: ADMIN_LIST_PAGE_SIZE,
  });
  const visiblePrograms = paginateItems(filteredPrograms, pagination);
  const publishedCount = programs.filter((program) => program.status === "published").length;
  const draftCount = programs.filter((program) => program.status === "draft").length;
  const archivedCount = programs.filter((program) => program.status === "archived").length;
  const categoryCounts = Array.from(
    filteredPrograms.reduce(
      (accumulator, program) => {
        const existingCategory = accumulator.get(program.category);

        accumulator.set(program.category, {
          code: program.category,
          name: getProgramCategoryName(program.categoryDetails, program.category),
          count: (existingCategory?.count ?? 0) + 1,
        });

        return accumulator;
      },
      new Map<string, { code: string; name: string; count: number }>(),
    ),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));

  const tableHeading = isArchivedView ? t("table.archivedHeading") : t("table.heading");
  const tableDescription = isArchivedView ? t("table.archivedDescription") : t("table.description");
  const emptyTableMessage = isArchivedView ? t("table.emptyArchived") : t("table.emptyActive");
  const tableAction = isArchivedView ? (
    <Link
      href="/admin/programs"
      className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
    >
      {t("table.showActive")}
    </Link>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={{ pathname: "/admin/programs", query: { view: "archived" } }}
        className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
      >
        {t("table.showArchived")}
      </Link>
      {canManage ? (
        <Link
          href="/admin/programs/new"
          className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          {t("table.newProgram")}
        </Link>
      ) : null}
    </div>
  );

  const feedbackTone = feedback === "destructive-confirmation-required" ? "admin-warning-banner" : "admin-success-banner";

  if (isArchivedView) {
    return (
      <div className="space-y-8">
        {feedback ? (
          <div
            className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}
          >
            {t(`feedback.${feedback}`)}
          </div>
        ) : null}

        <AdminWorkspaceSection
          title={tableHeading}
          description={tableDescription}
          action={tableAction}
          className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,232,0.84))] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.14)]"
          contentClassName="px-0 pb-0"
        >
          {visiblePrograms.length === 0 ? (
            <div className="px-6 py-8 text-sm leading-7 text-slate-600">{emptyTableMessage}</div>
          ) : null}
          <div className="overflow-x-auto">
            {visiblePrograms.length > 0 ? (
              <table className="admin-inner-table-shell min-w-full divide-y divide-emerald-900/8 text-left text-sm text-slate-700">
                <thead className="admin-table-head text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t("columns.program")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.category")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.featured")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.availability")}</th>
                    <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/8 bg-transparent">
                  {visiblePrograms.map((program) => (
                    <tr key={program.id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{program.translations[activeLocale].title}</p>
                        <p className="mt-2 max-w-sm text-sm text-slate-600">
                          {program.translations[activeLocale].shortDescription}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-slate-700">{getProgramCategoryName(program.categoryDetails, program.category)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                        >
                          {t(`statuses.${program.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                          {program.featured ? t("yes") : t("no")}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-700">{program.availability[activeLocale]}</td>
                      <td className="px-6 py-5">
                         {canManage ? (
                           <div className="flex flex-wrap gap-2">
                             <Link
                               href={{
                                 pathname: "/admin/programs/[id]/edit",
                                 params: { id: program.id },
                               }}
                               className={programRowActionLinkClassName}
                             >
                               {t("table.openEditor")}
                             </Link>
                             <form action={reactivateProgramAction.bind(null, activeLocale, program.id)}>
                               <button
                                 type="submit"
                                 className={programRowActionInfoClassName}
                               >
                                 {t("table.reactivate")}
                               </button>
                             </form>
                           </div>
                         ) : (
                           <span aria-hidden="true">—</span>
                         )}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
          <AdminPagination
            pathname="/admin/programs"
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            query={isArchivedView ? { view: "archived" } : undefined}
            copy={{
              previousLabel: t("pagination.previousLabel"),
              nextLabel: t("pagination.nextLabel"),
              pageSummary: t("pagination.pageSummary", {
                page: pagination.currentPage,
                totalPages: pagination.totalPages,
              }),
              rangeSummary: t("pagination.rangeSummary", {
                from: pagination.totalItems === 0 ? 0 : pagination.startIndex + 1,
                to: pagination.endIndex,
                total: pagination.totalItems,
              }),
            }}
          />
        </AdminWorkspaceSection>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        {feedback ? (
          <div
            className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}
          >
            {t(`feedback.${feedback}`)}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          {[
            { key: "catalogSize", value: 0 },
            { key: "publishedNow", value: 0 },
            { key: "draftBacklog", value: 0 },
            { key: "archivedNow", value: 0 },
          ].map((item) => (
            <article key={item.key} className="admin-inner-panel rounded-[28px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t(`stats.${item.key}.label`)}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{t(`stats.${item.key}.description`)}</p>
            </article>
          ))}
        </div>

        <AdminWorkspaceSection
          eyebrow={t("empty.eyebrow")}
          title={t("empty.title")}
          description={t("empty.description")}
           action={canManage ? (
             <Link
               href="/admin/programs/new"
               className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
             >
               {t("empty.cta")}
             </Link>
           ) : null}
           tone="default"
        >
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{t("empty.note")}</p>
        </AdminWorkspaceSection>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}
        >
          {t(`feedback.${feedback}`)}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { key: "catalogSize", value: programs.length },
          { key: "publishedNow", value: publishedCount },
          { key: "draftBacklog", value: draftCount },
          { key: "archivedNow", value: archivedCount },
        ].map((item) => (
          <article key={item.key} className="admin-inner-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t(`stats.${item.key}.label`)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{t(`stats.${item.key}.description`)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <AdminWorkspaceSection title={t("summary.heading")} description={t("summary.description")}>
          <div className="grid gap-3 md:grid-cols-3">
            {categoryCounts.map((category) => (
              <div key={category.code} className="admin-inner-panel-subtle rounded-2xl px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {category.name}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{category.count}</p>
              </div>
            ))}
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection title={t("actions.heading")} description={t("actions.description")}>
          <div className="space-y-3 text-sm leading-7 text-slate-700">
            {canManage ? (
              <Link
                href="/admin/programs/new"
                className="admin-primary-action inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold transition"
              >
                {t("actions.create")}
              </Link>
            ) : null}
            <Link
              href={
                isArchivedView
                  ? "/admin/programs"
                  : { pathname: "/admin/programs", query: { view: "archived" } }
              }
              className="admin-outline-action inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold transition"
            >
              {isArchivedView ? t("actions.showActive") : t("actions.showArchived")}
            </Link>
            <p className="admin-inner-panel-subtle rounded-2xl px-4 py-3 text-sm leading-6 text-slate-600">
              {t("actions.note")}
            </p>
          </div>
        </AdminWorkspaceSection>
      </div>

      <AdminWorkspaceSection
        title={tableHeading}
        description={tableDescription}
        action={tableAction}
        className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,232,0.84))] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.14)]"
        contentClassName="px-0 pb-0"
        >
          {visiblePrograms.length === 0 ? (
            <div className="px-6 py-8 text-sm leading-7 text-slate-600">{emptyTableMessage}</div>
          ) : null}
          <div className="overflow-x-auto">
          {visiblePrograms.length > 0 ? (
          <table className="admin-inner-table-shell min-w-full divide-y divide-emerald-900/8 text-left text-sm text-slate-700">
            <thead className="admin-table-head text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("columns.program")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.category")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.status")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.featured")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.availability")}</th>
                <th className="px-6 py-4 font-semibold">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/8 bg-transparent">
              {visiblePrograms.map((program) => (
                <tr key={program.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-950">{program.translations[activeLocale].title}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-600">
                      {program.translations[activeLocale].shortDescription}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate-700">{getProgramCategoryName(program.categoryDetails, program.category)}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusTheme[program.status]}`}
                    >
                      {t(`statuses.${program.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {program.featured ? t("yes") : t("no")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-700">{program.availability[activeLocale]}</td>
                  <td className="px-6 py-5">
                     {canManage ? (
                       <div className="flex flex-wrap gap-2">
                         <Link
                           href={{
                             pathname: "/admin/programs/[id]/edit",
                             params: { id: program.id },
                           }}
                           className={programRowActionLinkClassName}
                         >
                           {t("table.openEditor")}
                         </Link>
                         {program.status === "archived" ? (
                           <form action={reactivateProgramAction.bind(null, activeLocale, program.id)}>
                             <button
                               type="submit"
                               className="admin-info-action inline-flex rounded-full px-4 py-2 text-xs font-semibold transition"
                             >
                               {t("table.reactivate")}
                             </button>
                           </form>
                         ) : canDelete ? (
                           <form className={programRowActionFormClassName}>
                             <DestructiveActionConfirmation
                               title={t("table.archiveConfirmation.title")}
                               description={t("table.archiveConfirmation.description")}
                               warning={t("table.archiveConfirmation.warning")}
                               triggerLabel={t("table.archive")}
                               confirmLabel={t("table.archiveConfirmation.confirm")}
                               cancelLabel={t("table.archiveConfirmation.cancel")}
                               confirmValue="archive"
                               formAction={archiveProgramAction.bind(null, activeLocale, program.id)}
                               tone="warning"
                               actionLayout="stacked"
                               className="min-w-[10.5rem]"
                             />
                           </form>
                         ) : null}
                       </div>
                     ) : (
                       <span aria-hidden="true">—</span>
                     )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
           ) : null}
        </div>
        <AdminPagination
          pathname="/admin/programs"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          query={isArchivedView ? { view: "archived" } : undefined}
          copy={{
            previousLabel: t("pagination.previousLabel"),
            nextLabel: t("pagination.nextLabel"),
            pageSummary: t("pagination.pageSummary", {
              page: pagination.currentPage,
              totalPages: pagination.totalPages,
            }),
            rangeSummary: t("pagination.rangeSummary", {
              from: pagination.totalItems === 0 ? 0 : pagination.startIndex + 1,
              to: pagination.endIndex,
              total: pagination.totalItems,
            }),
          }}
        />
      </AdminWorkspaceSection>
    </div>
  );
}
