import { isIP } from "node:net";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";

import { defaultLocale, locales, type AppLocale } from "@/config/i18n";

export type AdminSession = {
  displayName: string | null;
  email: string;
  expiresAt: number;
  imageUrl: string | null;
};

type AdminSessionTokenPayload = AdminSession & {
  issuedAt: number;
};

type AdminOauthStatePayload = {
  expiresAt: number;
  issuedAt: number;
  nextPath: string;
};

export const adminSessionCookieName = "fp_pv_admin_session";
export const adminOauthStateCookieName = "fp_pv_admin_oauth_state";
export const adminSessionMaxAgeSeconds = 60 * 60 * 8;
export const adminOauthStateMaxAgeSeconds = 60 * 10;

const localizedAdminPathPattern = /^\/([a-z]{2}(?:-[a-z]{2})?)\/admin(?:[/?#].*)?$/i;
const localizedAdminLoginPathPattern = /^\/([a-z]{2}(?:-[a-z]{2})?)\/admin\/login(?:[/?#].*)?$/i;
const localizedPathPattern = /^\/([a-z]{2}(?:-[a-z]{2})?)(?:[/?#].*)?$/i;

function isSupportedLocale(locale: string): locale is AppLocale {
  return locales.includes(locale as AppLocale);
}

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function signValue(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAdminSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  let binary = "";

  for (const byte of new Uint8Array(signature)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createSignedToken(payload: object): Promise<string> {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

async function readSignedToken<T extends { expiresAt: number }>(token: string | undefined): Promise<T | null> {
  if (!token) {
    return null;
  }

  const [encodedPayload, receivedSignature] = token.split(".");

  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);

  if (expectedSignature !== receivedSignature) {
    return null;
  }

  const decodedPayload = base64UrlDecode(encodedPayload);

  if (!decodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodedPayload) as T;

    if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function getAllowedAdminEmail(): string {
  const allowedEmail = normalizeAdminEmail(process.env.ADMIN_ALLOWED_EMAIL);

  if (!allowedEmail) {
    throw new Error("Missing ADMIN_ALLOWED_EMAIL environment variable.");
  }

  return allowedEmail;
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return normalizeAdminEmail(email) === getAllowedAdminEmail();
}

export function hasVerifiedAdminEmail(
  email: string | null | undefined,
  emailVerified: boolean | null | undefined,
): email is string {
  return Boolean(email && emailVerified);
}

export function getAdminHomePath(locale: AppLocale = defaultLocale): string {
  return `/${locale}/admin`;
}

export function getLocalizedHomePath(locale: AppLocale = defaultLocale): string {
  return `/${locale}`;
}

export function resolveLocaleFromLocalizedPath(pathname: string): AppLocale | null {
  const match = pathname.match(localizedPathPattern);

  if (!match) {
    return null;
  }

  const locale = match[1].toLowerCase();

  return isSupportedLocale(locale) ? locale : null;
}

export function resolveLocaleFromAdminPath(pathname: string): AppLocale | null {
  const match = pathname.match(localizedAdminPathPattern);

  if (!match) {
    return null;
  }

  const locale = match[1].toLowerCase();

  return isSupportedLocale(locale) ? locale : null;
}

export function isLocalizedAdminPath(pathname: string): boolean {
  return resolveLocaleFromAdminPath(pathname) !== null;
}

export function isLocalizedAdminLoginPath(pathname: string): boolean {
  const match = pathname.match(localizedAdminLoginPathPattern);

  if (!match) {
    return false;
  }

  const locale = match[1].toLowerCase();

  return isSupportedLocale(locale);
}

export function sanitizeAdminNextPath(
  candidate: string | null | undefined,
  locale: AppLocale = defaultLocale,
): string {
  return sanitizeLocalizedNextPath(candidate, locale, { adminOnly: true });
}

export function sanitizeLocalizedNextPath(
  candidate: string | null | undefined,
  locale: AppLocale = defaultLocale,
  options?: { adminOnly?: boolean },
): string {
  const fallbackPath = options?.adminOnly ? getAdminHomePath(locale) : getLocalizedHomePath(locale);

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallbackPath;
  }

  const resolvedLocale = resolveLocaleFromLocalizedPath(candidate);

  if (!resolvedLocale || resolvedLocale !== locale || isLocalizedAdminLoginPath(candidate)) {
    return fallbackPath;
  }

  if (options?.adminOnly && !isLocalizedAdminPath(candidate)) {
    return fallbackPath;
  }

  return candidate;
}

export function buildAdminLoginPath(locale: AppLocale, nextPath?: string): string {
  const safeNextPath = sanitizeAdminNextPath(nextPath, locale);
  const searchParams = new URLSearchParams({ next: safeNextPath });

  return `/${locale}/admin/login?${searchParams.toString()}`;
}

export function buildAdminGoogleAuthUrl(nextPath: string): string {
  return `/api/admin/auth/google?next=${encodeURIComponent(nextPath)}`;
}

function normalizeAdminDisplayName(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 120);
}

function normalizeAdminImageUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function createAdminSessionToken(session: {
  displayName?: string | null;
  email: string;
  imageUrl?: string | null;
}): Promise<string> {
  const expiresAt = Date.now() + adminSessionMaxAgeSeconds * 1000;

  return createSignedToken({
    displayName: normalizeAdminDisplayName(session.displayName),
    email: normalizeAdminEmail(session.email),
    expiresAt,
    imageUrl: normalizeAdminImageUrl(session.imageUrl),
    issuedAt: Date.now(),
  } satisfies AdminSessionTokenPayload);
}

export async function readAdminSessionToken(token: string | undefined): Promise<AdminSession | null> {
  const payload = await readSignedToken<AdminSessionTokenPayload>(token);

  if (!payload || !isAllowedAdminEmail(payload.email)) {
    return null;
  }

  return {
    displayName: typeof payload.displayName === "string" ? payload.displayName : null,
    email: payload.email,
    expiresAt: payload.expiresAt,
    imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : null,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  return readAdminSessionToken(cookieStore.get(adminSessionCookieName)?.value);
}

export async function requireAdminSession(options: {
  locale: AppLocale;
  nextPath?: string;
}): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect(buildAdminLoginPath(options.locale, options.nextPath ?? getAdminHomePath(options.locale)));
  }

  return session;
}

export async function createAdminOauthStateToken(nextPath: string): Promise<string> {
  return createSignedToken({
    expiresAt: Date.now() + adminOauthStateMaxAgeSeconds * 1000,
    issuedAt: Date.now(),
    nextPath,
  } satisfies AdminOauthStatePayload);
}

export async function readAdminOauthStateToken(
  token: string | undefined,
): Promise<AdminOauthStatePayload | null> {
  const payload = await readSignedToken<AdminOauthStatePayload>(token);

  if (!payload) {
    return null;
  }

  const locale = resolveLocaleFromLocalizedPath(payload.nextPath) ?? defaultLocale;

  return {
    ...payload,
    nextPath: sanitizeLocalizedNextPath(payload.nextPath, locale),
  };
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: adminSessionCookieName,
    value: token,
    ...buildCookieOptions(adminSessionMaxAgeSeconds),
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    ...buildCookieOptions(0),
  });
}

export function setAdminOauthStateCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: adminOauthStateCookieName,
    value: token,
    ...buildCookieOptions(adminOauthStateMaxAgeSeconds),
  });
}

export function clearAdminOauthStateCookie(response: NextResponse): void {
  response.cookies.set({
    name: adminOauthStateCookieName,
    value: "",
    ...buildCookieOptions(0),
  });
}

export async function hasAdminSession(request: NextRequest): Promise<boolean> {
  return Boolean(await readAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value));
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const protocol = (forwardedProto || request.nextUrl.protocol.replace(/:$/, "") || "http").toLowerCase();

  if (host && !host.startsWith("/")) {
    try {
      return new URL(`${protocol}://${host}`).origin;
    } catch {
      // Fall through to Next's parsed origin.
    }
  }

  return request.nextUrl.origin;
}

function normalizeOriginHostname(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

function isGoogleOauthAllowedHostname(hostname: string): boolean {
  const normalizedHostname = normalizeOriginHostname(hostname);

  if (normalizedHostname === "localhost") {
    return true;
  }

  if (isIP(normalizedHostname) === 0) {
    return true;
  }

  return normalizedHostname === "127.0.0.1" || normalizedHostname === "::1";
}

function parseConfiguredAdminOrigin(): URL | null {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();

  if (!configuredOrigin) {
    return null;
  }

  try {
    return new URL(configuredOrigin);
  } catch {
    throw new Error("Invalid APP_ORIGIN environment variable.");
  }
}

export function getAdminRequestOrigin(request: NextRequest): string {
  return getRequestOrigin(request);
}

export function getAdminAppOrigin(request: NextRequest): string {
  const configuredOrigin = parseConfiguredAdminOrigin();

  if (!configuredOrigin) {
    return getRequestOrigin(request);
  }

  return configuredOrigin.origin;
}

export function getAdminGoogleOauthOrigin(request: NextRequest): string {
  const configuredOrigin = parseConfiguredAdminOrigin();

  if (configuredOrigin) {
    if (!isGoogleOauthAllowedHostname(configuredOrigin.hostname)) {
      throw new Error(
        "APP_ORIGIN must use localhost or a public domain for Google OAuth redirect URIs.",
      );
    }

    return configuredOrigin.origin;
  }

  const requestOrigin = new URL(getRequestOrigin(request));

  if (!isGoogleOauthAllowedHostname(requestOrigin.hostname)) {
    throw new Error(
      "Google OAuth requires APP_ORIGIN to be set to localhost or a public domain when the app is opened from a non-localhost host.",
    );
  }

  return requestOrigin.origin;
}

export function getAdminAppRequestUrl(request: NextRequest): URL {
  return new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, getAdminAppOrigin(request));
}
