import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createLimiter(): Ratelimit | null {
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
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:orders",
  });
}

const limiter = createLimiter();

export async function checkOrderRateLimit(
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
    // Upstash unreachable — fail open to avoid blocking legitimate orders
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
