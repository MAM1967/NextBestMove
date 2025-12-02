"use client";

import { useState, useEffect } from "react";

export type PremiumFeature =
  | "pattern_detection"
  | "pre_call_briefs"
  | "content_engine"
  | "performance_timeline";

interface PremiumFeatureCheck {
  hasAccess: boolean;
  isLoading: boolean;
}

/**
 * Hook to check if user has access to a premium feature
 * Returns access status and loading state
 */
export function usePremiumFeature(feature: PremiumFeature): PremiumFeatureCheck {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/billing/check-premium-feature?feature=${feature}`);
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess || false);
        }
      } catch (error) {
        console.error("Error checking premium feature access:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { hasAccess, isLoading };
}

/**
 * Check premium feature access and trigger upgrade modal if needed
 * Use this in components that need premium features
 */
export async function checkPremiumFeatureAccess(
  feature: PremiumFeature
): Promise<{ hasAccess: boolean; shouldShowUpgrade: boolean }> {
  try {
    const response = await fetch(`/api/billing/check-premium-feature?feature=${feature}`);
    if (response.ok) {
      const data = await response.json();
      return {
        hasAccess: data.hasAccess || false,
        shouldShowUpgrade: !data.hasAccess,
      };
    }
  } catch (error) {
    console.error("Error checking premium feature access:", error);
  }

  return { hasAccess: false, shouldShowUpgrade: true };
}

