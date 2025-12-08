/**
 * Utility to determine plan_type and plan_name from Stripe price_id
 * This ensures consistency between webhook handler and sync scripts
 */

export type PlanType = "standard" | "premium";
export type IntervalType = "month" | "year";

export interface PlanInfo {
  plan_type: PlanType;
  plan_name: string;
  interval: IntervalType;
}

/**
 * Determine if we're running in production
 */
function isProduction(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
  );
}

/**
 * Determine plan information from Stripe price_id
 * Compares against environment variables to identify the plan
 * Uses _L suffix variables in production, regular variables otherwise
 */
export function getPlanFromPriceId(priceId: string | null | undefined): PlanInfo {
  if (!priceId) {
    return {
      plan_type: "standard",
      plan_name: "Standard",
      interval: "month",
    };
  }

  const prod = isProduction();
  const suffix = prod ? "_L" : "";
  const fallbackSuffix = prod ? "" : "_L";

  const premiumMonthly =
    process.env[`STRIPE_PRICE_ID_PREMIUM_MONTHLY${suffix}`]?.trim() ||
    process.env[`STRIPE_PRICE_ID_PREMIUM_MONTHLY${fallbackSuffix}`]?.trim();
  const premiumYearly =
    process.env[`STRIPE_PRICE_ID_PREMIUM_YEARLY${suffix}`]?.trim() ||
    process.env[`STRIPE_PRICE_ID_PREMIUM_YEARLY${fallbackSuffix}`]?.trim();
  const standardMonthly =
    process.env[`STRIPE_PRICE_ID_STANDARD_MONTHLY${suffix}`]?.trim() ||
    process.env[`STRIPE_PRICE_ID_STANDARD_MONTHLY${fallbackSuffix}`]?.trim();
  const standardYearly =
    process.env[`STRIPE_PRICE_ID_STANDARD_YEARLY${suffix}`]?.trim() ||
    process.env[`STRIPE_PRICE_ID_STANDARD_YEARLY${fallbackSuffix}`]?.trim();

  const trimmedPriceId = priceId.trim();

  if (trimmedPriceId === premiumMonthly) {
    return {
      plan_type: "premium",
      plan_name: "Premium",
      interval: "month",
    };
  }

  if (trimmedPriceId === premiumYearly) {
    return {
      plan_type: "premium",
      plan_name: "Premium",
      interval: "year",
    };
  }

  if (trimmedPriceId === standardMonthly) {
    return {
      plan_type: "standard",
      plan_name: "Standard",
      interval: "month",
    };
  }

  if (trimmedPriceId === standardYearly) {
    return {
      plan_type: "standard",
      plan_name: "Standard",
      interval: "year",
    };
  }

  // Default to standard if price_id doesn't match
  console.warn(`Unknown price_id: ${priceId}. Defaulting to standard.`);
  return {
    plan_type: "standard",
    plan_name: "Standard",
    interval: "month",
  };
}

