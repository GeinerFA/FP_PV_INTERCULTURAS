import { getLocale, getTranslations } from "next-intl/server";

import { createAdminUserAction, toggleAdminUserActiveAction, updateAdminUserAction } from "@/app/[locale]/admin/settings/users/actions";
import type { AppLocale } from "@/config/i18n";
import { EditAdminUserPermissionMatrix } from "@/features/admin/components/edit-admin-user-permission-matrix";
import { CreateAdminUserForm } from "@/features/admin/components/create-admin-user-form";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";
import { listAdminUsers } from "@/services/admin-users/admin-user-service";
import { adminPermissionModules, type AdminUserRecord } from "@/types/admin-user";

type AdminUserSettingsProps = {
  feedback?:
    | "created"
    | "updated"
    | "activated"
    | "deactivated"
    | "invalid"
    | "save-failed"
    | "toggle-failed"
    | "duplicate-email"
    | "last-superadmin-protected";
  selectedUserId?: string;
  session: AdminSession;
  shouldOpenCreateDisclosure?: boolean;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.134l3.71-3.904a.75.75 0 1 1 1.08 1.04l-4.25 4.472a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" />
      <path d="M5.25 19.25c0-2.42 2.99-4.5 6.75-4.5 1.13 0 2.2.19 3.15.54" />
      <path d="M18.25 8.5v6" />
      <path d="M15.25 11.5h6" />
    </svg>
  );
}

function formatPermissionSummary(user: AdminUserRecord, t: Awaited<ReturnType<typeof getTranslations>>) {
  return adminPermissionModules
    .filter((module) => user.permissions[module].view)
    .map((module) => t(`modules.${module}.title`))
    .join(" · ");
}

function UserEntry({
  canActivate,
  canDeactivate,
  activeLocale,
  canManage,
  t,
  user,
  shouldOpen,
}: {
  canActivate: boolean;
  canDeactivate: boolean;
  activeLocale: AppLocale;
  canManage: boolean;
  shouldOpen: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
  user: AdminUserRecord;
}) {
  const roleTone = user.role === "superadmin" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-300 bg-slate-50 text-slate-700";
  const activeTone = user.active ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-700";

  return (
    <details className="group admin-inner-panel rounded-[28px]" open={shouldOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 text-left transition hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:p-6 lg:flex-row lg:items-start lg:justify-between [&::-webkit-details-marker]:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-950">{user.fullName}</h3>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${roleTone}`}>
              {t(`roles.${user.role}`)}
            </span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${activeTone}`}>
              {user.active ? t("statuses.active") : t("statuses.inactive")}
            </span>
          </div>
          <p className="text-sm text-slate-600">{user.email}</p>
          <p className="text-sm text-slate-600">
            {t("entry.nationalId")}: {user.nationalId ?? t("entry.missingNationalId")}
          </p>
          <p className="text-sm text-slate-600">
            {t("entry.permissions")}: {formatPermissionSummary(user, t) || t("entry.noPermissions")}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="group-open:hidden">{t("entry.disclosureClosedLabel")}</span>
            <span className="hidden group-open:inline">{t("entry.disclosureOpenLabel")}</span>
          </p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/12 bg-white text-slate-500 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.32)] transition duration-300 ease-out group-open:rotate-180 group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-emerald-800 motion-reduce:transition-none">
            <ChevronDownIcon className="h-4 w-4" />
          </span>
        </div>
      </summary>

      <div className="border-t border-emerald-900/8 px-5 pb-5 pt-5 md:px-6 md:pb-6">
        <form action={updateAdminUserAction.bind(null, activeLocale, user.id)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.email")}</span>
              <input name="email" defaultValue={user.email} disabled={!canManage} className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition disabled:opacity-60" />
            </label>
            <label className="block space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.fullName")}</span>
              <input name="fullName" defaultValue={user.fullName} disabled={!canManage} className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition disabled:opacity-60" />
            </label>
            <label className="block space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.nationalId")}</span>
              <input name="nationalId" defaultValue={user.nationalId ?? ""} disabled={!canManage} className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition disabled:opacity-60" />
            </label>
            <div className="block space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("fields.role")}</span>
              <div className="admin-inner-input flex min-h-12 items-center rounded-2xl px-4 py-3 text-sm text-slate-700">
                {t(`roles.${user.role}`)}
              </div>
              <p className="text-sm leading-7 text-slate-600">{t("fields.roleDerived")}</p>
            </div>
          </div>

          <input type="hidden" name="active" value={user.active ? "on" : "off"} />
          <p className="text-sm text-slate-700">{t("fields.keepActive")}: {user.active ? t("statuses.active") : t("statuses.inactive")}</p>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("matrix.title")}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{t("matrix.description")}</p>
            </div>
            <EditAdminUserPermissionMatrix
              permissions={user.permissions}
              disabled={!canManage}
              grantAllLabel={t("create.grantAllLabel")}
              grantAllHint={t("create.grantAllHint")}
              moduleLabel={t("matrix.module")}
              description={t("matrix.description")}
              actionLabels={{
                view: t("matrix.actions.view"),
                manage: t("matrix.actions.manage"),
                delete: t("matrix.actions.delete"),
              }}
              moduleTitles={{
                dashboard: t("modules.dashboard.title"),
                programs: t("modules.programs.title"),
                applications: t("modules.applications.title"),
                activity: t("modules.activity.title"),
                settings: t("modules.settings.title"),
                users: t("modules.users.title"),
              }}
            />
            <p className="text-sm leading-7 text-slate-600">{t("matrix.superadminNote")}</p>
            <p className="text-sm leading-7 text-slate-600">{t("matrix.deleteMeaning")}</p>
            <p className="text-sm leading-7 text-slate-600">{t("matrix.usersDeleteMeaning")}</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              {canManage ? (
                <button type="submit" className="admin-secondary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
                  {t("actions.save")}
                </button>
              ) : null}
              {user.active && canDeactivate ? (
                <button formAction={toggleAdminUserActiveAction.bind(null, activeLocale, user.id, false)} type="submit" className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
                  {t("actions.deactivate")}
                </button>
              ) : null}
              {!user.active && canActivate ? (
                <button formAction={toggleAdminUserActiveAction.bind(null, activeLocale, user.id, true)} type="submit" className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
                  {t("actions.activate")}
                </button>
              ) : null}
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("entry.updatedAt", { updatedAt: new Date(user.updatedAt).toLocaleString() })}</p>
          </div>
        </form>
      </div>
    </details>
  );
}

export async function AdminUserSettings({ feedback, selectedUserId, session, shouldOpenCreateDisclosure = false }: AdminUserSettingsProps) {
  const [t, locale] = await Promise.all([getTranslations("AdminUserSettings"), getLocale()]);

  let adminUsers: Awaited<ReturnType<typeof listAdminUsers>>;

  try {
    adminUsers = await listAdminUsers();
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection eyebrow={t("unavailable.eyebrow")} title={t("unavailable.title")} description={t("unavailable.description")} tone="warning">
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("unavailable.note")}</p>
      </AdminWorkspaceSection>
    );
  }

  const activeLocale = locale as AppLocale;
  const canManage = hasAdminPermission(session, "users.manage");
  const canActivate = canManage;
  const canDeactivate = hasAdminPermission(session, "users.delete");
  const createAction = createAdminUserAction.bind(null, activeLocale);
  const feedbackTone = feedback === "invalid" || feedback === "save-failed" || feedback === "toggle-failed" || feedback === "duplicate-email" || feedback === "last-superadmin-protected"
    ? "admin-warning-banner"
    : "admin-success-banner";
  const activeUsers = adminUsers.filter((user) => user.active).length;
  const activeSuperadmins = adminUsers.filter((user) => user.active && user.role === "superadmin").length;

  return (
    <div id="admin-user-settings-top" className="space-y-8">
      {feedback ? <div className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}>{t(`feedback.${feedback}`)}</div> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("stats.total.label")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{adminUsers.length}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.total.description")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("stats.active.label")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{activeUsers}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.active.description")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("stats.superadmins.label")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{activeSuperadmins}</p>
          <p className="mt-2 text-sm text-slate-600">{t("stats.superadmins.description")}</p>
        </article>
      </div>

      <AdminWorkspaceSection title={t("list.title")} description={t("list.description")}>
        {adminUsers.length === 0 ? <p className="text-sm leading-7 text-slate-600">{t("empty")}</p> : null}

        <div className="space-y-5">
          {adminUsers.map((user) => (
            <UserEntry
              key={user.id}
              activeLocale={activeLocale}
              canActivate={canActivate}
              canDeactivate={canDeactivate}
              canManage={canManage}
              shouldOpen={selectedUserId === user.id}
              t={t}
              user={user}
            />
          ))}
        </div>
      </AdminWorkspaceSection>

      {canManage ? (
        <details className="group" open={shouldOpenCreateDisclosure}>
          <summary className="admin-primary-action inline-flex max-w-full cursor-pointer list-none items-center gap-3 rounded-full px-5 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white [&::-webkit-details-marker]:hidden">
            <UserPlusIcon className="h-5 w-5" />
            <span>
              <span className="group-open:hidden">{t("create.disclosureClosedLabel")}</span>
              <span className="hidden group-open:inline">{t("create.disclosureOpenLabel")}</span>
            </span>
          </summary>

          <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out group-open:grid-rows-[1fr] group-open:opacity-100 motion-reduce:transition-none">
            <div className="overflow-hidden">
              <AdminWorkspaceSection className="mt-4" title={t("create.title")} description={t("create.description")}>
                <CreateAdminUserForm
                  action={createAction}
                  copy={{
                    disclosureHint: t("create.disclosureHint"),
                    grantAllLabel: t("create.grantAllLabel"),
                    grantAllHint: t("create.grantAllHint"),
                    fields: {
                      email: t("fields.email"),
                      fullName: t("fields.fullName"),
                      nationalId: t("fields.nationalId"),
                      keepActive: t("fields.keepActive"),
                    },
                    matrix: {
                      title: t("matrix.title"),
                      description: t("matrix.description"),
                      module: t("matrix.module"),
                      superadminNote: t("matrix.superadminNote"),
                      deleteMeaning: t("matrix.deleteMeaning"),
                      usersDeleteMeaning: t("matrix.usersDeleteMeaning"),
                      actions: {
                        view: t("matrix.actions.view"),
                        manage: t("matrix.actions.manage"),
                        delete: t("matrix.actions.delete"),
                      },
                    },
                    modules: {
                      dashboard: { title: t("modules.dashboard.title") },
                      programs: { title: t("modules.programs.title") },
                      applications: { title: t("modules.applications.title") },
                      activity: { title: t("modules.activity.title") },
                      settings: { title: t("modules.settings.title") },
                      users: { title: t("modules.users.title") },
                    },
                    placeholders: {
                      email: t("placeholders.email"),
                      fullName: t("placeholders.fullName"),
                      nationalId: t("placeholders.nationalId"),
                    },
                    actions: {
                      create: t("actions.create"),
                    },
                  }}
                />
              </AdminWorkspaceSection>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
