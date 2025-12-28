/**
 * Feature comparison data for pricing page
 * 
 * Defines all features and their availability across Free, Standard, and Premium tiers
 */

export type FeatureValue = string | number | boolean | "✓" | "-" | "Limited";

export interface Feature {
  name: string;
  description?: string;
  free: FeatureValue;
  standard: FeatureValue;
  premium: FeatureValue;
  category?: string;
}

export const PRICING_FEATURES: Feature[] = [
  // Core Features
  {
    name: "Active relationships",
    description: "Number of active relationships you can manage",
    free: 5,
    standard: 20,
    premium: "Unlimited",
  },
  {
    name: "Archived relationships",
    description: "Access to archived relationships",
    free: "✓",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Manual daily plan",
    description: "Create your daily plan manually",
    free: "✓",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Automatic daily plan",
    description: "AI-generated daily plan based on your calendar and priorities",
    free: "-",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Actions per day",
    description: "Recommended number of actions per day",
    free: "2-3",
    standard: "5-6",
    premium: "8-10",
  },
  {
    name: "Fast Win",
    description: "Quick 5-minute action to build momentum",
    free: "✓",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Follow-up scheduling",
    description: "Schedule follow-up actions",
    free: "Limited",
    standard: "Unlimited",
    premium: "Unlimited",
  },
  {
    name: "Relationship history",
    description: "View history of interactions with relationships",
    free: "✓",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Weekly summary",
    description: "Weekly review of your activity",
    free: "Basic (no AI)",
    standard: "AI-assisted",
    premium: "Advanced AI",
  },
  {
    name: "Weekly insights",
    description: "AI-generated insights about your patterns",
    free: "-",
    standard: "1/week",
    premium: "Multiple",
  },
  {
    name: "Content generation",
    description: "AI-generated content prompts based on your actions",
    free: "-",
    standard: "Limited",
    premium: "High",
  },
  {
    name: "Calendar free/busy sizing",
    description: "Daily plan sized based on calendar availability",
    free: "-",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Calendar event details",
    description: "View details of calendar events",
    free: "-",
    standard: "✓",
    premium: "✓",
  },
  {
    name: "Call briefs",
    description: "Pre-call briefs for scheduled meetings",
    free: "-",
    standard: "✓ (no notes)",
    premium: "✓ (with notes)",
  },
  {
    name: "Pre-call notes",
    description: "AI-generated notes and context before calls",
    free: "-",
    standard: "-",
    premium: "✓",
  },
  {
    name: "Pattern views & trends",
    description: "Visualize patterns and trends in your activity",
    free: "-",
    standard: "-",
    premium: "✓",
  },
  {
    name: "Momentum & timeline views",
    description: "Performance timeline and momentum tracking",
    free: "-",
    standard: "-",
    premium: "✓",
  },
  {
    name: "Data export",
    description: "Export your data",
    free: "Basic",
    standard: "CSV",
    premium: "Advanced",
  },
  {
    name: "Support level",
    description: "Customer support priority",
    free: "Standard",
    standard: "Standard",
    premium: "Priority",
  },
];

export interface PricingTier {
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    tagline: "Memory Relief",
    description: "Helps you remember who to follow up with",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: 0,
  },
  {
    name: "Standard",
    tagline: "Decision Automation",
    description: "Runs your day with automatic daily plans sized to your calendar",
    monthlyPrice: 29,
    yearlyPrice: 249,
    yearlySavings: 99,
    popular: true,
  },
  {
    name: "Premium",
    tagline: "Intelligence & Leverage",
    description: "Thinks with you. Pattern detection, pre-call briefs, content engine, unlimited relationships",
    monthlyPrice: 79,
    yearlyPrice: 649,
    yearlySavings: 299,
  },
];

