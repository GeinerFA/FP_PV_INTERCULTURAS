const googleRecaptchaSiteVerifyUrl = "https://www.google.com/recaptcha/api/siteverify";
const recaptchaVerificationTimeoutMs = 5_000;

const googleRecaptchaV2TestSiteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const googleRecaptchaV2TestSecretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
const googleRecaptchaTestHostname = "testkey.google.com";

type GoogleRecaptchaSiteVerifyResponse = {
  success?: boolean;
  hostname?: string;
  challenge_ts?: string;
  ["error-codes"]?: string[];
};

export type RecaptchaVerificationResult = {
  success: boolean;
  hostname: string | null;
  challengeTimestamp: string | null;
  errorCodes: string[];
};

function normalizeHostname(hostname: string): string {
  return hostname.trim().replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

function parseHostnameFromHostHeader(hostHeader: string): string | null {
  const normalizedHost = hostHeader.split(",")[0]?.trim() ?? "";

  if (normalizedHost.length === 0 || normalizedHost.startsWith("/")) {
    return null;
  }

  try {
    return new URL(`https://${normalizedHost}`).hostname;
  } catch {
    return null;
  }
}

function resolveHostnameFromRequestHeaders(requestHeaders: Headers): string | null {
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const parsedHostname = host ? parseHostnameFromHostHeader(host) : null;

  return parsedHostname ? normalizeHostname(parsedHostname) : null;
}

function readRecaptchaEnvValue(
  envName: "NEXT_PUBLIC_RECAPTCHA_SITE_KEY" | "RECAPTCHA_SECRET_KEY",
  fallbackValue: string,
): string {
  const value = process.env[envName]?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return fallbackValue;
  }

  throw new Error(`${envName} environment variable is required in production.`);
}

export function getPublicRecaptchaSiteKey(): string {
  return readRecaptchaEnvValue("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", googleRecaptchaV2TestSiteKey);
}

function getRecaptchaSecretKey(): string {
  return readRecaptchaEnvValue("RECAPTCHA_SECRET_KEY", googleRecaptchaV2TestSecretKey);
}

function isUsingGoogleRecaptchaFallbackTestCredentials(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const configuredSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  const configuredSecretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();

  return !configuredSiteKey && !configuredSecretKey;
}

export function resolveExpectedRecaptchaHostname(requestHeaders: Headers): string | null {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();

  if (configuredOrigin) {
    try {
      return normalizeHostname(new URL(configuredOrigin).hostname);
    } catch {
      console.warn("[recaptcha] Ignoring invalid APP_ORIGIN and falling back to request host", {
        appOrigin: configuredOrigin,
      });
    }
  }

  return resolveHostnameFromRequestHeaders(requestHeaders);
}

export function isExpectedRecaptchaHostname(
  verificationHostname: string | null,
  expectedHostname: string | null,
): boolean {
  if (!verificationHostname || !expectedHostname) {
    return false;
  }

  const normalizedVerificationHostname = normalizeHostname(verificationHostname);
  const normalizedExpectedHostname = normalizeHostname(expectedHostname);

  if (normalizedVerificationHostname === normalizedExpectedHostname) {
    return true;
  }

  return (
    isUsingGoogleRecaptchaFallbackTestCredentials() &&
    normalizedVerificationHostname === googleRecaptchaTestHostname
  );
}

export async function verifyRecaptchaToken({
  token,
  remoteIp,
}: {
  token: string;
  remoteIp?: string | null;
}): Promise<RecaptchaVerificationResult> {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return {
      success: false,
      hostname: null,
      challengeTimestamp: null,
      errorCodes: ["missing-input-response"],
    };
  }

  try {
    const payload = new URLSearchParams({
      secret: getRecaptchaSecretKey(),
      response: normalizedToken,
    });

    if (remoteIp && remoteIp.trim().length > 0) {
      payload.set("remoteip", remoteIp.trim());
    }

    const response = await fetch(googleRecaptchaSiteVerifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(recaptchaVerificationTimeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        hostname: null,
        challengeTimestamp: null,
        errorCodes: [`http-${response.status}`],
      };
    }

    const result = (await response.json()) as GoogleRecaptchaSiteVerifyResponse;

    return {
      success: result.success === true,
      hostname: typeof result.hostname === "string" ? result.hostname : null,
      challengeTimestamp: typeof result.challenge_ts === "string" ? result.challenge_ts : null,
      errorCodes: Array.isArray(result["error-codes"]) ? result["error-codes"] : [],
    };
  } catch (error) {
    console.error("[recaptcha] Failed to verify token", {
      error,
      hasRemoteIp: Boolean(remoteIp),
    });

    return {
      success: false,
      hostname: null,
      challengeTimestamp: null,
      errorCodes: ["verification-request-failed"],
    };
  }
}
