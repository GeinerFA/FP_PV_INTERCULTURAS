import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { locales } from "@/config/i18n";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const localePrefixPattern = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/i;

export function proxy(request: NextRequest) {
  const localePrefixMatch = request.nextUrl.pathname.match(localePrefixPattern);

  if (localePrefixMatch) {
    const requestedLocale = localePrefixMatch[1].toLowerCase();

    if (!locales.includes(requestedLocale as (typeof locales)[number])) {
      return NextResponse.next();
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
