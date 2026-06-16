import { redirect } from "next/navigation";

import type { AppLocale } from "@/config/i18n";

type ContactPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  redirect(`/${locale}#contact`);
}
