import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createLimiter(prefix: string, requests: number): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, "1 m"),
    prefix,
  });
}

const orderLimiter = createLimiter("rl:orders", 10);
const cancelLimiter = createLimiter("rl:cancel", 5);

async function checkLimit(
  limiter: Ratelimit | null,
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!limiter) return { allowed: true, retryAfterSeconds: 0 };
  try {
    const { success, reset } = await limiter.limit(ip);
    return {
      allowed: success,
      retryAfterSeconds: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
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
