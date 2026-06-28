import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for when Upstash is unreachable OR unconfigured.
// Configurable window per IP — used on Redis errors and when Redis env vars are absent.
class MemoryFallback {
  private readonly buckets = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs = 60_000
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      // Prune all expired buckets on each new/reset entry to bound memory growth.
      for (const [k, v] of this.buckets) {
        if (now > v.resetAt) this.buckets.delete(k);
      }
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (bucket.count >= this.maxRequests) return false;
    bucket.count++;
    return true;
  }
}

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
  requests: number,
  window: Duration = RATE_LIMIT_WINDOW
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  });
}

const redis = createRedis();
if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL / TOKEN missing — using in-memory fallback in production"
  );
}
const orderLimiter = redis ? createLimiter(redis, "rl:orders", 10) : null;
const cancelLimiter = redis ? createLimiter(redis, "rl:cancel", 5) : null;
const trackLimiter = redis ? createLimiter(redis, "rl:track", 30) : null;
const loginLimiter = redis ? createLimiter(redis, "rl:login", 5, "15 m") : null;

const orderFallback = new MemoryFallback(10);
const cancelFallback = new MemoryFallback(5);
const trackFallback = new MemoryFallback(30);
const loginFallback = new MemoryFallback(5, 15 * 60_000);

async function checkLimit(
  limiter: Ratelimit | null,
  fallback: MemoryFallback,
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  // Unresolvable IPs share a sentinel bucket rather than bypassing the limiter.
  const effectiveIp = ip === "unknown" ? "unknown-ip" : ip;
  if (!limiter)
    return { allowed: fallback.check(effectiveIp), retryAfterSeconds: 0 };
  try {
    const { success, reset } = await limiter.limit(effectiveIp);
    return {
      allowed: success,
      retryAfterSeconds: success
        ? 0
        : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error(
      "[ratelimit] Upstash unreachable — using in-memory fallback:",
      err
    );
    return { allowed: fallback.check(effectiveIp), retryAfterSeconds: 0 };
  }
}

export function checkOrderRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(orderLimiter, orderFallback, ip);
}

export function checkCancelRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(cancelLimiter, cancelFallback, ip);
}

export function checkTrackRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(trackLimiter, trackFallback, ip);
}

export function checkLoginRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return checkLimit(loginLimiter, loginFallback, ip);
}

export function getClientIp(req: {
  headers: { get: (name: string) => string | null };
}): string {
  // x-vercel-forwarded-for is set server-side by Vercel and cannot be spoofed.
  // x-real-ip / x-forwarded-for are client-controlled fallbacks for other hosts.
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
