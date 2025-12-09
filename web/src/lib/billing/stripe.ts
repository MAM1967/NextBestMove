import Stripe from "stripe";
import {
  PLAN_CONFIG,
  getPlanMetadata as getPlanMetadataClient,
  type PlanType,
  type IntervalType,
} from "./plans";

// Lazy initialization to avoid errors during build when env vars aren't available
let stripeInstance: Stripe | null = null;

/**
 * Get the correct Stripe secret key, with workaround for Vercel env var propagation issues
 */
function getStripeSecretKey(): string {
  let rawKey = process.env.STRIPE_SECRET_KEY;
  
  if (!rawKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // Sanitize the API key: remove any whitespace, newlines, or invalid characters
  let sanitizedKey = rawKey.trim().replace(/\s+/g, "");

  // WORKAROUND: Vercel production env vars not propagating correctly
  // If we detect production environment but have test keys, use live keys
  const vercelEnv = process.env.VERCEL_ENV;
  const isProduction = vercelEnv === "production" || process.env.NODE_ENV === "production";
  const isTestKey = sanitizedKey.startsWith("sk_test_");
  const isLiveKey = sanitizedKey.startsWith("sk_live_");

  // Hardcoded production Stripe keys (only used as fallback when Vercel env vars fail)
  // TODO: Remove this once Vercel env var propagation is fixed
  const PRODUCTION_STRIPE_SECRET_KEY = "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";
  const PRODUCTION_PRICE_IDS = {
    STANDARD_MONTHLY: "price_1ScDH9Irhm12Lbxf8af6p0TK",
    STANDARD_YEARLY: "price_1ScDIJIrhm12LbxfF9LZeB5G",
    PREMIUM_MONTHLY: "price_1ScDJWIrhm12Lbxf2alCQakP",
    PREMIUM_YEARLY: "price_1ScDKZIrhm12LbxfcNF3XSsN",
  };

  if (isProduction && isTestKey) {
    console.warn("🚨 CRITICAL: Production environment detected but TEST Stripe key found!");
    console.warn(`   Raw key prefix: ${rawKey.substring(0, 20)}...`);
    console.warn(`   VERCEL_ENV: ${vercelEnv || "NOT_SET"}`);
    console.warn(`   NODE_ENV: ${process.env.NODE_ENV || "NOT_SET"}`);
    console.warn(`   🔧 WORKAROUND: Overriding with production live key`);
    sanitizedKey = PRODUCTION_STRIPE_SECRET_KEY;
  }

  // Validate key format
  if (!sanitizedKey.match(/^sk_(test|live)_[a-zA-Z0-9]+$/)) {
    throw new Error(
      `Invalid STRIPE_SECRET_KEY format. Expected format: sk_test_... or sk_live_... ` +
        `Got: ${sanitizedKey.substring(0, 20)}... (length: ${
          sanitizedKey.length
        })`
    );
  }

  return sanitizedKey;
}

function getStripe(): Stripe {
  if (!stripeInstance) {
    const sanitizedKey = getStripeSecretKey();

    stripeInstance = new Stripe(sanitizedKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Re-export types for convenience
export type { PlanType, IntervalType };

/**
 * Get price ID from environment variables dynamically
 * Includes workaround for Vercel env var propagation issues
 */
function getPriceIdFromEnv(
  plan: PlanType,
  interval: IntervalType
): string | null {
  // Hardcoded production price IDs (fallback when Vercel env vars fail)
  const PRODUCTION_PRICE_IDS: Record<string, string> = {
    standard_month: "price_1ScDH9Irhm12Lbxf8af6p0TK",
    standard_year: "price_1ScDIJIrhm12LbxfF9LZeB5G",
    premium_month: "price_1ScDJWIrhm12Lbxf2alCQakP",
    premium_year: "price_1ScDKZIrhm12LbxfcNF3XSsN",
  };

  const envVarMap: Record<string, string> = {
    standard_month: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY || "",
    standard_year: process.env.STRIPE_PRICE_ID_STANDARD_YEARLY || "",
    premium_month: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || "",
    premium_year: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY || "",
  };

  const key = `${plan}_${interval === "month" ? "month" : "year"}`;
  let priceId = envVarMap[key];

  // Trim whitespace and newlines (common issue with Vercel env vars)
  let cleanedPriceId = priceId ? priceId.trim().replace(/\s+/g, "") : null;

  // WORKAROUND: If we're in production and price ID is missing, use hardcoded fallback
  const vercelEnv = process.env.VERCEL_ENV;
  const isProduction = vercelEnv === "production" || process.env.NODE_ENV === "production";
  
  if (isProduction && !cleanedPriceId && PRODUCTION_PRICE_IDS[key]) {
    console.warn(`🚨 CRITICAL: Production price ID missing for ${key}, using fallback`);
    cleanedPriceId = PRODUCTION_PRICE_IDS[key];
  }

  return cleanedPriceId || null;
}

export const PLANS = PLAN_CONFIG;

/**
 * Get price ID for a plan and interval
 */
export function getPriceId(
  plan: PlanType,
  interval: IntervalType
): string | null {
  const priceId = getPriceIdFromEnv(plan, interval);
  if (!priceId) {
    console.error(`Price ID not found for ${plan}/${interval}`);
    console.error("Environment check:", {
      STRIPE_PRICE_ID_STANDARD_MONTHLY: process.env
        .STRIPE_PRICE_ID_STANDARD_MONTHLY
        ? "set"
        : "missing",
      STRIPE_PRICE_ID_STANDARD_YEARLY: process.env
        .STRIPE_PRICE_ID_STANDARD_YEARLY
        ? "set"
        : "missing",
      STRIPE_PRICE_ID_PREMIUM_MONTHLY: process.env
        .STRIPE_PRICE_ID_PREMIUM_MONTHLY
        ? "set"
        : "missing",
      STRIPE_PRICE_ID_PREMIUM_YEARLY: process.env
        .STRIPE_PRICE_ID_PREMIUM_YEARLY
        ? "set"
        : "missing",
    });
    return null;
  }
  return priceId;
}

/**
 * Get plan metadata for display (server-side, uses same config as client)
 */
export function getPlanMetadata(
  plan: PlanType,
  interval: IntervalType
): { name: string; amount: number; interval: string } | null {
  return getPlanMetadataClient(plan, interval);
}
