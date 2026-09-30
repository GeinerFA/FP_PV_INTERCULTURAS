import type { AppLocale } from "@/config/i18n";
import { redirect } from "next/navigation";

import { getPathname } from "@/i18n/navigation";

type ContactPageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  redirect(`${getPathname({ href: "/", locale })}#contact`);
}
