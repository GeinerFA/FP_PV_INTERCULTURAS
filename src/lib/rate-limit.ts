type RateLimitWindow = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number;
};

const rateLimitWindows = new Map<string, RateLimitWindow>();

/**
 * Fixed-window, in-memory rate limit. Enough for a single server; on serverless or several instances
 * each one keeps its own count, so a shared store (e.g. Upstash Redis) would be needed there.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now = Date.now(),
): RateLimitResult {
  const current = rateLimitWindows.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + windowMs });

    return { ok: true, retryAfterSec: 0 };
  }

  if (current.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;

  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  rateLimitWindows.clear();
}
