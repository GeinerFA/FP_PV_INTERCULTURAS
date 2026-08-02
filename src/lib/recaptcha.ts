const googleRecaptchaSiteVerifyUrl = "https://www.google.com/recaptcha/api/siteverify";
const recaptchaVerificationTimeoutMs = 5_000;

const googleRecaptchaV2TestSiteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const googleRecaptchaV2TestSecretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

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
