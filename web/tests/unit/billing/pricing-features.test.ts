import { describe, it, expect } from "vitest";
import { PRICING_FEATURES, PRICING_TIERS } from "@/lib/billing/pricing-features";
import type { FeatureValue } from "@/lib/billing/pricing-features";

describe("pricing-features", () => {
  describe("PRICING_FEATURES", () => {
    it("should have all required features", () => {
      const featureNames = PRICING_FEATURES.map((f) => f.name);
      
      expect(featureNames).toContain("Active relationships");
      expect(featureNames).toContain("Archived relationships");
      expect(featureNames).toContain("Manual daily plan");
      expect(featureNames).toContain("Automatic daily plan");
      expect(featureNames).toContain("Actions per day");
      expect(featureNames).toContain("Fast Win");
      expect(featureNames).toContain("Follow-up scheduling");
      expect(featureNames).toContain("Relationship history");
      expect(featureNames).toContain("Weekly summary");
      expect(featureNames).toContain("Weekly insights");
      expect(featureNames).toContain("Content generation");
      expect(featureNames).toContain("Calendar free/busy sizing");
      expect(featureNames).toContain("Calendar event details");
      expect(featureNames).toContain("Call briefs");
      expect(featureNames).toContain("Pre-call notes");
      expect(featureNames).toContain("Pattern views & trends");
      expect(featureNames).toContain("Momentum & timeline views");
      expect(featureNames).toContain("Data export");
      expect(featureNames).toContain("Support level");
    });

    it("should have all three tiers for each feature", () => {
      PRICING_FEATURES.forEach((feature) => {
        expect(feature.free).toBeDefined();
        expect(feature.standard).toBeDefined();
        expect(feature.premium).toBeDefined();
      });
    });

    it("should have Free tier with limited features", () => {
      const activeRelationships = PRICING_FEATURES.find((f) => f.name === "Active relationships");
      expect(activeRelationships?.free).toBe(5);

      const automaticPlan = PRICING_FEATURES.find((f) => f.name === "Automatic daily plan");
      expect(automaticPlan?.free).toBe("-");

      const weeklyInsights = PRICING_FEATURES.find((f) => f.name === "Weekly insights");
      expect(weeklyInsights?.free).toBe("-");
    });

    it("should have Standard tier with enhanced features", () => {
      const activeRelationships = PRICING_FEATURES.find((f) => f.name === "Active relationships");
      expect(activeRelationships?.standard).toBe(20);

      const automaticPlan = PRICING_FEATURES.find((f) => f.name === "Automatic daily plan");
      expect(automaticPlan?.standard).toBe("✓");

      const weeklySummary = PRICING_FEATURES.find((f) => f.name === "Weekly summary");
      expect(weeklySummary?.standard).toBe("AI-assisted");
    });

    it("should have Premium tier with unlimited relationships", () => {
      const activeRelationships = PRICING_FEATURES.find((f) => f.name === "Active relationships");
      expect(activeRelationships?.premium).toBe("Unlimited");

      const preCallNotes = PRICING_FEATURES.find((f) => f.name === "Pre-call notes");
      expect(preCallNotes?.premium).toBe("✓");

      const patternViews = PRICING_FEATURES.find((f) => f.name === "Pattern views & trends");
      expect(patternViews?.premium).toBe("✓");
    });
  });

  describe("PRICING_TIERS", () => {
    it("should have three tiers", () => {
      expect(PRICING_TIERS).toHaveLength(3);
    });

    it("should have Free tier with $0 pricing", () => {
      const freeTier = PRICING_TIERS.find((t) => t.name === "Free");
      expect(freeTier).toBeDefined();
      expect(freeTier?.monthlyPrice).toBe(0);
      expect(freeTier?.yearlyPrice).toBe(0);
      expect(freeTier?.yearlySavings).toBe(0);
      expect(freeTier?.tagline).toBe("Memory Relief");
    });

    it("should have Standard tier with correct pricing", () => {
      const standardTier = PRICING_TIERS.find((t) => t.name === "Standard");
      expect(standardTier).toBeDefined();
      expect(standardTier?.monthlyPrice).toBe(29);
      expect(standardTier?.yearlyPrice).toBe(249);
      expect(standardTier?.yearlySavings).toBe(99);
      expect(standardTier?.popular).toBe(true);
      expect(standardTier?.tagline).toBe("Decision Automation");
    });

    it("should have Premium tier with correct pricing", () => {
      const premiumTier = PRICING_TIERS.find((t) => t.name === "Premium");
      expect(premiumTier).toBeDefined();
      expect(premiumTier?.monthlyPrice).toBe(79);
      expect(premiumTier?.yearlyPrice).toBe(649);
      expect(premiumTier?.yearlySavings).toBe(299);
      expect(premiumTier?.tagline).toBe("Intelligence & Leverage");
    });

    it("should calculate yearly savings correctly", () => {
      const standardTier = PRICING_TIERS.find((t) => t.name === "Standard");
      const monthlyTotal = (standardTier?.monthlyPrice || 0) * 12;
      const yearlyPrice = standardTier?.yearlyPrice || 0;
      const savings = monthlyTotal - yearlyPrice;
      expect(savings).toBe(standardTier?.yearlySavings);

      const premiumTier = PRICING_TIERS.find((t) => t.name === "Premium");
      const premiumMonthlyTotal = (premiumTier?.monthlyPrice || 0) * 12;
      const premiumYearlyPrice = premiumTier?.yearlyPrice || 0;
      const premiumSavings = premiumMonthlyTotal - premiumYearlyPrice;
      expect(premiumSavings).toBe(premiumTier?.yearlySavings);
    });
  });
});

