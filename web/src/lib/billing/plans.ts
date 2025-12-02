/**
 * Client-safe plan configuration
 * This file can be imported in client components without requiring Stripe initialization
 */

export type PlanType = "standard" | "professional";
export type IntervalType = "month" | "year";

export const PLAN_CONFIG: Record<
  PlanType,
  Record<IntervalType, { amount: number; name: string; interval: string }>
> = {
  standard: {
    month: {
      amount: 2900, // $29.00 in cents
      name: "Standard",
      interval: "month",
    },
    year: {
      amount: 24900, // $249.00 in cents
      name: "Standard",
      interval: "year",
    },
  },
  professional: {
    month: {
      amount: 7900, // $79.00 in cents
      name: "Professional",
      interval: "month",
    },
    year: {
      amount: 64900, // $649.00 in cents
      name: "Professional",
      interval: "year",
    },
  },
};

/**
 * Get plan metadata for display (client-safe)
 */
export function getPlanMetadata(
  plan: PlanType,
  interval: IntervalType
): { name: string; amount: number; interval: string } | null {
  const planData = PLAN_CONFIG[plan];
  if (!planData) {
    return null;
  }

  const metadata = planData[interval];
  if (!metadata) {
    return null;
  }

  return {
    name: metadata.name,
    amount: metadata.amount,
    interval: metadata.interval,
  };
}






