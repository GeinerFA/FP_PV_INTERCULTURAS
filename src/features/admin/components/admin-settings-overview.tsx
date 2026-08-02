import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";

type AdminSettingsOverviewProps = {
  session: AdminSession;
};

export async function AdminSettingsOverview({ session }: AdminSettingsOverviewProps) {
  const t = await getTranslations("AdminSettingsOverview");
  const modules = [
    hasAdminPermission(session, "settings.view")
      ? {
          key: "categories",
          href: "/admin/settings/categories",
          action: t("modules.categories.action"),
        }
      : null,
    hasAdminPermission(session, "settings.view")
      ? {
          key: "homeVideos",
          href: "/admin/settings/home-videos",
          action: t("modules.homeVideos.action"),
        }
      : null,
    hasAdminPermission(session, "settings.view")
      ? {
          key: "faqs",
          href: "/admin/settings/faqs",
          action: t("modules.faqs.action"),
        }
      : null,
    hasAdminPermission(session, "users.view")
      ? {
          key: "users",
          href: "/admin/settings/users",
          action: t("modules.users.action"),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: "categories" | "faqs" | "homeVideos" | "users";
    href:
      | "/admin/settings/categories"
      | "/admin/settings/faqs"
      | "/admin/settings/home-videos"
      | "/admin/settings/users";
    action: string;
  }>;

  return (
    <AdminWorkspaceSection eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <div className="space-y-6">
        <p className="max-w-3xl text-sm leading-7 text-slate-700">{t("note")}</p>
        <div className="grid gap-4 xl:grid-cols-2">
          {modules.map((module) => (
            <article key={module.key} className="admin-inner-panel rounded-[28px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t(`modules.${module.key}.eyebrow`)}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{t(`modules.${module.key}.title`)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{t(`modules.${module.key}.description`)}</p>
              <Link
                href={module.href}
                className="admin-primary-action mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold transition"
              >
                {module.action}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </AdminWorkspaceSection>
  );
}
