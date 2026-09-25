import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../lib/db/client.js";

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

export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests, keyPrefix } = { ...defaultConfig, ...config };
  const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt.getTime() < now) {
      const resetAt = now + windowMs;
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, window: windowMs, resetAt: new Date(resetAt) },
        update: { count: 1, resetAt: new Date(resetAt) },
      });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt.getTime() };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: existing.count + 1 },
    });

    return { allowed: true, remaining: maxRequests - existing.count - 1, resetAt: existing.resetAt.getTime() };
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