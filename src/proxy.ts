import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale } from "@/config/i18n";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const legacyEnglishLocalePattern = /^\/en(?=\/|$)/;

export function proxy(request: NextRequest) {
  if (legacyEnglishLocalePattern.test(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    const normalizedPathname =
      request.nextUrl.pathname.replace(legacyEnglishLocalePattern, `/${defaultLocale}`) ||
      `/${defaultLocale}`;

    redirectUrl.pathname = normalizedPathname;

    return NextResponse.redirect(redirectUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
