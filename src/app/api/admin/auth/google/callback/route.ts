import { NextResponse, type NextRequest } from "next/server";

import {
  adminOauthStateCookieName,
  buildAdminLoginPath,
  clearAdminOauthStateCookie,
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminAppOrigin,
  hasVerifiedAdminEmail,
  isAllowedAdminEmail,
  readAdminOauthStateToken,
  resolveLocaleFromAdminPath,
  setAdminSessionCookie,
} from "@/lib/admin-session";

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
};

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials.");
  }

  return { clientId, clientSecret };
}

function buildLoginRedirect(request: NextRequest, nextPath: string, error: string) {
  const locale = resolveLocaleFromAdminPath(nextPath) ?? "es";
  const loginUrl = new URL(buildAdminLoginPath(locale, nextPath), request.url);
  loginUrl.searchParams.set("error", error);

  const response = NextResponse.redirect(loginUrl);
  clearAdminOauthStateCookie(response);
  clearAdminSessionCookie(response);

  return response;
}

async function exchangeCodeForAccessToken(request: NextRequest, code: string): Promise<string | null> {
  const { clientId, clientSecret } = getGoogleCredentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${getAdminAppOrigin(request)}/api/admin/auth/google/callback`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const token = (await response.json()) as GoogleTokenResponse;

  return token.access_token ?? null;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GoogleUserInfo;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateFromQuery = await readAdminOauthStateToken(state ?? undefined);
  const nextPath = stateFromQuery?.nextPath ?? "/es/admin";

  if (!code || !state || request.nextUrl.searchParams.get("error")) {
    return buildLoginRedirect(request, nextPath, "oauth");
  }

  const stateFromCookie = request.cookies.get(adminOauthStateCookieName)?.value;

  if (!stateFromCookie || stateFromCookie !== state || !stateFromQuery) {
    return buildLoginRedirect(request, nextPath, "state");
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(request, code);

    if (!accessToken) {
      return buildLoginRedirect(request, nextPath, "oauth");
    }

    const userInfo = await fetchGoogleUserInfo(accessToken);

    if (
      !userInfo ||
      !hasVerifiedAdminEmail(userInfo.email, userInfo.email_verified) ||
      !isAllowedAdminEmail(userInfo.email)
    ) {
      return buildLoginRedirect(request, nextPath, "access_denied");
    }

    const sessionToken = await createAdminSessionToken(userInfo.email);
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    clearAdminOauthStateCookie(response);
    setAdminSessionCookie(response, sessionToken);

    return response;
  } catch {
    return buildLoginRedirect(request, nextPath, "config");
  }
}
