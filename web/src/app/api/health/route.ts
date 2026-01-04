/**
 * Health check endpoint for monitoring
 * 
 * Checks:
 * - Database connectivity (Supabase)
 * - Stripe API connectivity
 * - Critical environment variables
 * 
 * Returns:
 * - "healthy" if all checks pass
 * - "degraded" if any check fails
 * - Response times for each check
 * 
 * Safety:
 * - Lightweight implementation (<100ms target)
 * - Non-blocking checks (individual failures don't break endpoint)
 * - Read-only operations only
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/billing/stripe";
import { logError, logInfo } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheck {
  status: "ok" | "error";
  responseTime: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: HealthCheck;
    stripe: HealthCheck;
    env: HealthCheck & {
      missingVars?: string[];
    };
  };
  timestamp: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const supabase = createAdminClient();
    // Simple SELECT 1 query to test connectivity
    const { error } = await supabase.from("users").select("id").limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: "error",
        responseTime,
        error: error.message,
      };
    }
    
    return {
      status: "ok",
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      status: "error",
      responseTime,
      error: error?.message || "Unknown error",
    };
  }
}

/**
 * Check Stripe API connectivity
 */
async function checkStripe(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    // Minimal read-only call to test API connectivity
    // Using account retrieval (lightweight, read-only)
    await stripe.accounts.retrieve();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: "ok",
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Don't log Stripe errors as application errors (they're health check failures)
    // Only log if it's an unexpected error type
    if (error?.type !== "StripeAuthenticationError" && error?.type !== "StripeAPIError") {
      logError("Unexpected Stripe health check error", error);
    }
    
    return {
      status: "error",
      responseTime,
      error: error?.message || "Unknown error",
    };
  }
}

/**
 * Check critical environment variables
 */
function checkEnvironment(): HealthCheck & { missingVars?: string[] } {
  const startTime = Date.now();
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
  ];
  
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === "") {
      missingVars.push(varName);
    }
  }
  
  const responseTime = Date.now() - startTime;
  
  if (missingVars.length > 0) {
    return {
      status: "error",
      responseTime,
      error: `Missing environment variables: ${missingVars.join(", ")}`,
      missingVars,
    };
  }
  
  return {
    status: "ok",
    responseTime,
  };
}

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    // Run all checks in parallel for speed
    const [databaseCheck, stripeCheck, envCheck] = await Promise.all([
      checkDatabase(),
      checkStripe(),
      Promise.resolve(checkEnvironment()), // Environment check is synchronous
    ]);
    
    // Determine overall status
    // "healthy" = all checks pass
    // "degraded" = some checks fail (but endpoint is still functional)
    // "unhealthy" = critical checks fail (shouldn't happen, but included for completeness)
    const allChecksPass = 
      databaseCheck.status === "ok" &&
      stripeCheck.status === "ok" &&
      envCheck.status === "ok";
    
    const anyCriticalFailure = 
      envCheck.status === "error" || // Environment variables are critical
      (databaseCheck.status === "error" && stripeCheck.status === "error"); // Both external services down
    
    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (allChecksPass) {
      overallStatus = "healthy";
    } else if (anyCriticalFailure) {
      overallStatus = "unhealthy";
    } else {
      overallStatus = "degraded";
    }
    
    const response: HealthResponse = {
      status: overallStatus,
      checks: {
        database: databaseCheck,
        stripe: stripeCheck,
        env: envCheck,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Log health check results (only in non-production or if degraded/unhealthy)
    if (process.env.NODE_ENV !== "production" || overallStatus !== "healthy") {
      logInfo("Health check completed", {
        status: overallStatus,
        database: databaseCheck.status,
        stripe: stripeCheck.status,
        env: envCheck.status,
      });
    }
    
    // Return appropriate status code
    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    // If health check itself fails, return unhealthy
    logError("Health check endpoint error", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: {
          database: { status: "error", responseTime: 0, error: "Health check failed" },
          stripe: { status: "error", responseTime: 0, error: "Health check failed" },
          env: { status: "error", responseTime: 0, error: "Health check failed" },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

