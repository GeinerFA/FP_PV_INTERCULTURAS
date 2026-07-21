import { NextResponse, type NextRequest } from "next/server";

import {
  clearAdminOauthStateCookie,
  clearAdminSessionCookie,
  resolveLocaleFromLocalizedPath,
  sanitizeLocalizedNextPath,
} from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const requestedNextPath = request.nextUrl.searchParams.get("next");
  const locale = resolveLocaleFromLocalizedPath(requestedNextPath ?? "") ?? "es";
  const nextPath = sanitizeLocalizedNextPath(requestedNextPath, locale);
  const response = NextResponse.redirect(new URL(nextPath, request.url));

  clearAdminOauthStateCookie(response);
  clearAdminSessionCookie(response);

  return response;
}
