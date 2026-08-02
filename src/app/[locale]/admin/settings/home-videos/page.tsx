import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { AdminPageTemplate } from "@/features/admin/components/admin-page-template";
import { AdminHomeHeroVideoSettings } from "@/features/home-hero-videos/components/admin-home-hero-video-settings";
import { Link } from "@/i18n/navigation";
import { requireAdminSession } from "@/lib/admin-session";

type AdminHomeHeroVideoSettingsFeedback = NonNullable<Parameters<typeof AdminHomeHeroVideoSettings>[0]["feedback"]>;

const adminHomeHeroVideoFeedbackStatuses = new Set<AdminHomeHeroVideoSettingsFeedback>([
  "created",
  "reordered",
  "deleted",
  "invalid",
  "save-failed",
  "delete-failed",
  "reorder-failed",
]);

function parseAdminHomeHeroVideoFeedback(status?: string): Parameters<typeof AdminHomeHeroVideoSettings>[0]["feedback"] {
  if (!status || !adminHomeHeroVideoFeedbackStatuses.has(status as AdminHomeHeroVideoSettingsFeedback)) {
    return undefined;
  }

  return status as AdminHomeHeroVideoSettingsFeedback;
}

type AdminSettingsHomeVideosPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ status?: string; video?: string }>;
};

export default async function AdminSettingsHomeVideosPage({ params, searchParams }: AdminSettingsHomeVideosPageProps) {
  const [{ locale }, { status, video }] = await Promise.all([params, searchParams]);
  const feedback = parseAdminHomeHeroVideoFeedback(status);
  const t = await getTranslations("AdminSettingsOverview");
  const session = await requireAdminSession({ locale, nextPath: `/${locale}/admin/settings/home-videos`, permission: "settings.view" });

  return (
    <AdminPageTemplate
      pageKey="settingsHomeVideos"
      variant="workspace"
      useInnerWorkspace
      sections={[]}
      headerAction={
        <Link href="/admin/settings" className="admin-outline-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
          {t("backAction")}
        </Link>
      }
    >
      <AdminHomeHeroVideoSettings feedback={feedback} selectedVideoId={video} session={session} />
    </AdminPageTemplate>
  );
}
