/**
 * Rate limiting middleware for API routes
 * 
 * Features:
 * - Per-IP rate limiting for public endpoints
 * - Per-user rate limiting for authenticated endpoints
 * - Feature flag: ENABLE_RATE_LIMITING (default: false)
 * - Whitelist critical endpoints (webhooks, health, cron)
 * - Generous initial limits (10x expected usage)
 * 
 * Safety:
 * - Defaults to disabled in production
 * - Can be disabled instantly via environment variable
 * - Logs all rate limit hits for analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logWarn, logInfo } from "@/lib/utils/logger";

// Feature flag - MUST default to false in production
const RATE_LIMITING_ENABLED = process.env.ENABLE_RATE_LIMITING === "true";

// Initialize Redis client (only if rate limiting is enabled)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (RATE_LIMITING_ENABLED) {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });

      // Create rate limiters with generous limits (10x expected usage)
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(600, "1 m"), // 600 req/min default (will override per endpoint)
        analytics: true,
        prefix: "@upstash/ratelimit",
      });
    } catch (error) {
      console.error("[Rate Limit] Failed to initialize Redis:", error);
      // Fail gracefully - rate limiting will be disabled
    }
  } else {
    console.warn(
      "[Rate Limit] Rate limiting enabled but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set"
    );
  }
}

// Rate limit configurations per endpoint type
const RATE_LIMIT_CONFIGS = {
  // Auth endpoints: 50 req/min per IP
  auth: {
    limit: 50,
    window: "1 m",
  },
  // API endpoints: 600 req/min per IP or user
  api: {
    limit: 600,
    window: "1 m",
  },
  // Daily plan generation: 10 req/hour per user
  dailyPlan: {
    limit: 10,
    window: "1 h",
  },
} as const;

// Whitelisted endpoints that should never be rate limited
const WHITELISTED_PATHS = [
  "/api/billing/webhook", // Stripe webhooks
  "/api/health", // Health checks
  "/api/cron/", // All cron jobs
];

/**
 * Check if a path should be whitelisted from rate limiting
 */
function isWhitelisted(pathname: string): boolean {
  return WHITELISTED_PATHS.some((whitelisted) =>
    pathname.startsWith(whitelisted)
  );
}

/**
 * Get rate limit configuration for a given path
 */
function getRateLimitConfig(pathname: string): {
  limit: number;
  window: string;
} {
  // Auth endpoints
  if (pathname.startsWith("/api/auth/")) {
    return RATE_LIMIT_CONFIGS.auth;
  }

  // Daily plan generation
  if (pathname === "/api/daily-plans" || pathname.startsWith("/api/daily-plans")) {
    return RATE_LIMIT_CONFIGS.dailyPlan;
  }

  // Default API rate limit
  return RATE_LIMIT_CONFIGS.api;
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
function getRateLimitIdentifier(
  request: NextRequest,
  userId?: string
): string {
  // Use user ID if authenticated, otherwise use IP
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address from request
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 * 
 * @returns null if rate limiting is disabled, whitelisted, or passes
 * @returns NextResponse with 429 status if rate limit exceeded
 */
export async function checkRateLimit(
  request: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  // If rate limiting is disabled, return null (no rate limit check)
  if (!RATE_LIMITING_ENABLED) {
    return null;
  }

  // If Redis/ratelimit not initialized, skip rate limiting
  if (!redis || !ratelimit) {
    return null;
  }

  const pathname = request.nextUrl.pathname;

  // Check if path is whitelisted
  if (isWhitelisted(pathname)) {
    return null;
  }

  // Get rate limit configuration
  const config = getRateLimitConfig(pathname);
  const identifier = getRateLimitIdentifier(request, userId);

  try {
    // Create a custom limiter for this specific endpoint type
    // Convert window string to Duration format expected by Upstash
    const windowDuration = config.window as "1 m" | "1 h" | "1 d";
    const customLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, windowDuration),
      analytics: true,
      prefix: `@upstash/ratelimit:${pathname}`,
    });

    // Check rate limit
    const { success, limit, remaining, reset } = await customLimiter.limit(
      identifier
    );

    if (!success) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

      logWarn("Rate limit exceeded", {
        pathname,
        identifier: identifier.substring(0, 20) + "...", // Don't log full IP/user ID
        limit,
        remaining,
        retryAfter,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
          },
        }
      );
    }

    // Log rate limit hits for analysis (only in staging/dev)
    if (process.env.NODE_ENV !== "production") {
      logInfo("Rate limit check passed", {
        pathname,
        identifier: identifier.substring(0, 20) + "...",
        remaining,
        limit,
      });
    }

    return null; // Rate limit passed
  } catch (error) {
    // If rate limiting fails, log error but don't block request
    console.error("[Rate Limit] Error checking rate limit:", error);
    return null; // Fail open - don't block requests if rate limiting fails
  }
}

