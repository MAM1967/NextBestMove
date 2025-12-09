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
 * Get the Stripe secret key from environment variables
 */
function getStripeSecretKey(): string {
  const rawKey = process.env.STRIPE_SECRET_KEY;
  
  if (!rawKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // Sanitize the API key: remove any whitespace, newlines, or invalid characters
  const sanitizedKey = rawKey.trim().replace(/\s+/g, "");

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
 * Get price ID from environment variables
 */
function getPriceIdFromEnv(
  plan: PlanType,
  interval: IntervalType
): string | null {
  const envVarMap: Record<string, string> = {
    standard_month: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY || "",
    standard_year: process.env.STRIPE_PRICE_ID_STANDARD_YEARLY || "",
    premium_month: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || "",
    premium_year: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY || "",
  };

  const key = `${plan}_${interval === "month" ? "month" : "year"}`;
  const priceId = envVarMap[key];

  // Trim whitespace and newlines
  const cleanedPriceId = priceId ? priceId.trim().replace(/\s+/g, "") : null;

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
