import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const RATE_LIMIT_WINDOW = "1 m" as const;

function createLimiter(
  redis: Redis,
  prefix: string,
  requests: number
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, RATE_LIMIT_WINDOW),
    prefix,
  });
}

const redis = createRedis();
if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL / TOKEN missing — rate limiting is disabled in production"
  );
}
const orderLimiter = redis ? createLimiter(redis, "rl:orders", 10) : null;
const cancelLimiter = redis ? createLimiter(redis, "rl:cancel", 5) : null;
const trackLimiter = redis ? createLimiter(redis, "rl:track", 30) : null;

async function checkLimit(
  limiter: Ratelimit | null,
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!limiter || ip === "unknown")
    return { allowed: true, retryAfterSeconds: 0 };
  try {
    const { success, reset } = await limiter.limit(ip);
    return {
      allowed: success,
      retryAfterSeconds: success
        ? 0
        : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error("[ratelimit] Upstash unreachable — failing open:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function checkOrderRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(orderLimiter, ip);
}

export function checkCancelRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(cancelLimiter, ip);
}

export function checkTrackRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(trackLimiter, ip);
}

export function getClientIp(req: {
  headers: { get: (name: string) => string | null };
}): string {
  return (
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
