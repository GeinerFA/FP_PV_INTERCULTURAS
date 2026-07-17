import { NextResponse, type NextRequest } from "next/server";

import {
  adminSessionCookieName,
  buildAdminLoginPath,
  createAdminOauthStateToken,
  getAdminAppOrigin,
  getAdminAppRequestUrl,
  getAdminGoogleOauthOrigin,
  getAdminRequestOrigin,
  readAdminSessionToken,
  resolveLocaleFromLocalizedPath,
  sanitizeLocalizedNextPath,
  setAdminOauthStateCookie,
} from "@/lib/admin-session";

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable.");
  }

  return clientId;
}

function getSafeAdminAppOrigin(request: NextRequest): string {
  try {
    return getAdminAppOrigin(request);
  } catch {
    return request.nextUrl.origin;
  }
}

export async function GET(request: NextRequest) {
  const requestedNextPath = request.nextUrl.searchParams.get("next");
  const requestedLocale = resolveLocaleFromLocalizedPath(requestedNextPath ?? "") ?? "es";
  const nextPath = sanitizeLocalizedNextPath(requestedNextPath, requestedLocale);

  try {
    const adminAppOrigin = getAdminGoogleOauthOrigin(request);
    const requestOrigin = getAdminRequestOrigin(request);

    if (adminAppOrigin !== requestOrigin) {
      return NextResponse.redirect(getAdminAppRequestUrl(request));
    }

    const existingSession = await readAdminSessionToken(
      request.cookies.get(adminSessionCookieName)?.value,
    );

    if (existingSession) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }

    const state = await createAdminOauthStateToken(nextPath);
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", getGoogleClientId());
    authUrl.searchParams.set("redirect_uri", `${adminAppOrigin}/api/admin/auth/google/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl);
    setAdminOauthStateCookie(response, state);

    return response;
  } catch {
    const loginUrl = new URL(buildAdminLoginPath(requestedLocale, nextPath), getSafeAdminAppOrigin(request));
    loginUrl.searchParams.set("error", "config");

    return NextResponse.redirect(loginUrl);
  }
}
