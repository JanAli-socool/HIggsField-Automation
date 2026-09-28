import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "./db/client.js";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  keyPrefix: "ratelimit",
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests, keyPrefix } = { ...defaultConfig, ...config };
  const ip = req.headers["x-forwarded-for"] as string || req.socket?.remoteAddress || "unknown";
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  try {
    let existing = memoryStore.get(key);

    if (!existing || existing.resetAt < now) {
      const resetAt = now + windowMs;
      existing = { count: 1, resetAt };
      memoryStore.set(key, existing);
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    memoryStore.set(key, existing);

    return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true, remaining: maxRequests, resetAt: now + windowMs };
  }
}

export function setRateLimitHeaders(res: VercelResponse, remaining: number, resetAt: number): void {
  res.setHeader("X-RateLimit-Limit", "60");
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
}

export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  return async (req: VercelRequest, res: VercelResponse, next: () => void) => {
    const result = await rateLimit(req, res, config);
    setRateLimitHeaders(res, result.remaining, result.resetAt);

    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000).toString());
      return res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests", retry_after: Math.ceil((result.resetAt - Date.now()) / 1000) },
      });
    }

    next();
  };
}