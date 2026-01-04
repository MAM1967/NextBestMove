/**
 * CORS middleware for API routes
 * 
 * Features:
 * - Feature flag: ENABLE_CORS_RESTRICTION (default: false)
 * - Defaults to allowing all origins (backward compatible)
 * - Only restricts if explicitly configured
 * - Whitelist production + staging domains
 * 
 * Safety:
 * - Preserves existing behavior if not configured
 * - Defaults to allowing all (maintains backward compatibility)
 * - Can be disabled instantly via environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { logInfo, logWarn } from "@/lib/utils/logger";

// Feature flag - MUST default to false (allows all origins)
const CORS_RESTRICTION_ENABLED = process.env.ENABLE_CORS_RESTRICTION === "true";

// Allowed origins (only used if CORS_RESTRICTION_ENABLED is true)
const ALLOWED_ORIGINS = [
  "https://nextbestmove.app", // Production
  "https://staging.nextbestmove.app", // Staging
  "http://localhost:3000", // Local development
  "http://localhost:3001", // Local development (alternative port)
];

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string): boolean {
  if (!CORS_RESTRICTION_ENABLED) {
    // If CORS restriction is disabled, allow all origins (backward compatible)
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = request.headers.get("origin");

  // If no origin header, return response as-is (not a CORS request)
  if (!origin) {
    return response;
  }

  // If CORS restriction is disabled, allow all origins
  if (!CORS_RESTRICTION_ENABLED) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  // CORS restriction is enabled - check if origin is allowed
  if (isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    
    // Log in non-production for debugging
    if (process.env.NODE_ENV !== "production") {
      logInfo("CORS allowed", { origin });
    }
  } else {
    // Origin not allowed - log warning but don't block (let the API route handle it)
    logWarn("CORS origin not allowed", { origin, allowedOrigins: ALLOWED_ORIGINS });
    // Don't set CORS headers - browser will block the request
  }

  return response;
}

/**
 * Handle OPTIONS preflight requests
 * 
 * @returns NextResponse with CORS headers if origin is allowed, or 403 if not
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  // If no origin header, return null (not a CORS preflight)
  if (!origin) {
    return null;
  }

  // If CORS restriction is disabled, allow all origins
  if (!CORS_RESTRICTION_ENABLED) {
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }

  // CORS restriction is enabled - check if origin is allowed
  if (isOriginAllowed(origin)) {
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }

  // Origin not allowed - return 403
  logWarn("CORS preflight rejected", { origin, allowedOrigins: ALLOWED_ORIGINS });
  return new NextResponse(null, {
    status: 403,
    headers: {
      "Access-Control-Allow-Origin": origin, // Still set origin for error visibility
    },
  });
}

/**
 * Check if CORS should be applied to a request
 * 
 * @returns true if CORS headers should be applied, false otherwise
 */
export function shouldApplyCors(pathname: string): boolean {
  // Only apply CORS to API routes
  return pathname.startsWith("/api");
}

