import Stripe from "stripe";
import { PLAN_CONFIG, getPlanMetadata as getPlanMetadataClient, type PlanType, type IntervalType } from "./plans";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Re-export types for convenience
export type { PlanType, IntervalType };

/**
 * Get price ID from environment variables dynamically
 */
function getPriceIdFromEnv(plan: PlanType, interval: IntervalType): string | null {
  const envVarMap: Record<string, string> = {
    "standard_month": process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY || "",
    "standard_year": process.env.STRIPE_PRICE_ID_STANDARD_YEARLY || "",
    "professional_month": process.env.STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY || "",
    "professional_year": process.env.STRIPE_PRICE_ID_PROFESSIONAL_YEARLY || "",
  };
  
  const key = `${plan}_${interval === "month" ? "month" : "year"}`;
  const priceId = envVarMap[key];
  return priceId || null;
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
      STRIPE_PRICE_ID_STANDARD_MONTHLY: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY ? "set" : "missing",
      STRIPE_PRICE_ID_STANDARD_YEARLY: process.env.STRIPE_PRICE_ID_STANDARD_YEARLY ? "set" : "missing",
      STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY: process.env.STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY ? "set" : "missing",
      STRIPE_PRICE_ID_PROFESSIONAL_YEARLY: process.env.STRIPE_PRICE_ID_PROFESSIONAL_YEARLY ? "set" : "missing",
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

