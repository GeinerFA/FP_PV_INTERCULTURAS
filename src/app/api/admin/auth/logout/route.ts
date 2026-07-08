import { NextResponse, type NextRequest } from "next/server";

import {
  buildAdminLoginPath,
  clearAdminOauthStateCookie,
  clearAdminSessionCookie,
  resolveLocaleFromAdminPath,
  sanitizeAdminNextPath,
} from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const requestedNextPath = request.nextUrl.searchParams.get("next");
  const locale = resolveLocaleFromAdminPath(requestedNextPath ?? "") ?? "es";
  const nextPath = sanitizeAdminNextPath(requestedNextPath, locale);
  const loginUrl = new URL(buildAdminLoginPath(locale, nextPath), request.url);
  const response = NextResponse.redirect(loginUrl);

  clearAdminOauthStateCookie(response);
  clearAdminSessionCookie(response);

  return response;
}
