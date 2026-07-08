import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { locales } from "@/config/i18n";
import { routing } from "@/i18n/routing";
import {
  buildAdminLoginPath,
  hasAdminSession,
  isLocalizedAdminLoginPath,
  isLocalizedAdminPath,
  resolveLocaleFromAdminPath,
} from "@/lib/admin-session";

const intlMiddleware = createMiddleware(routing);
const localePrefixPattern = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/i;

export async function proxy(request: NextRequest) {
  const localePrefixMatch = request.nextUrl.pathname.match(localePrefixPattern);

  if (localePrefixMatch) {
    const requestedLocale = localePrefixMatch[1].toLowerCase();

    if (!locales.includes(requestedLocale as (typeof locales)[number])) {
      return NextResponse.next();
    }
  }

  if (isLocalizedAdminPath(request.nextUrl.pathname) && !isLocalizedAdminLoginPath(request.nextUrl.pathname)) {
    const locale = resolveLocaleFromAdminPath(request.nextUrl.pathname);

    if (locale && !(await hasAdminSession(request))) {
      const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      const loginUrl = new URL(buildAdminLoginPath(locale, nextPath), request.url);

      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
