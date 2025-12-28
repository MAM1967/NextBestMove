/**
 * Tier Labels and Descriptions
 * 
 * Provides user-facing labels and descriptions for Free/Standard/Premium tiers
 * based on the reverse trial model and PRD tier specifications.
 */

import type { UserTier } from "./tier";

export interface TierInfo {
  name: string;
  tagline: string;
  description: string;
}

export const TIER_INFO: Record<UserTier, TierInfo> = {
  free: {
    name: "Free",
    tagline: "Memory Relief",
    description: "Helps you remember who to follow up with. 5 active relationships, manual planning, basic weekly review.",
  },
  standard: {
    name: "Standard",
    tagline: "Decision Automation",
    description: "Runs your day with automatic daily plans sized to your calendar. 20 active relationships, AI-assisted weekly summaries.",
  },
  premium: {
    name: "Premium",
    tagline: "Intelligence & Leverage",
    description: "Thinks with you. Pattern detection, pre-call briefs, content engine, unlimited relationships, and deeper insights.",
  },
};

/**
 * Get user-facing tier information
 */
export function getTierInfo(tier: UserTier): TierInfo {
  return TIER_INFO[tier];
}

/**
 * Get tier name for display
 */
export function getTierName(tier: UserTier): string {
  return TIER_INFO[tier].name;
}

/**
 * Get tier tagline for display
 */
export function getTierTagline(tier: UserTier): string {
  return TIER_INFO[tier].tagline;
}






