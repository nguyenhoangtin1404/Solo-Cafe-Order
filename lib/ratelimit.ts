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

function createLimiter(
  redis: Redis,
  prefix: string,
  requests: number
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, "1 m"),
    prefix,
  });
}

const redis = createRedis();
const orderLimiter = redis ? createLimiter(redis, "rl:orders", 10) : null;
const cancelLimiter = redis ? createLimiter(redis, "rl:cancel", 5) : null;

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
  } catch {
    // Upstash unreachable — fail open to avoid blocking legitimate requests
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
