import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PublicPageTemplate } from "@/features/public/components/public-page-template";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.contact");

  return buildMetadata({ title: t("title"), description: t("description") });
}

export default function ContactPage() {
  return <PublicPageTemplate pageKey="contact" />;
}
