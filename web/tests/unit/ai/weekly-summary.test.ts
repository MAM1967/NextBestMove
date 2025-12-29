import { describe, it, expect, vi } from "vitest";
import {
  generateAINarrativeSummary,
  generateEnhancedAINarrativeSummary,
  generateAIInsight,
  generateEnhancedAIInsights,
  generateAINextWeekFocus,
  generateEnhancedAINextWeekFocus,
} from "@/lib/ai/weekly-summary";

// Mock the OpenAI module
vi.mock("@/lib/ai/openai", () => ({
  generateWithAI: vi.fn().mockResolvedValue("AI-generated content"),
  getOpenAIClientForUser: vi.fn().mockReturnValue({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "AI-generated insight 1\nAI-generated insight 2" } }],
        }),
      },
    },
  }),
}));

describe("weekly-summary AI functions", () => {
  const baseMetrics = {
    daysActive: 5,
    actionsCompleted: 10,
    replies: 3,
    callsBooked: 1,
    currentStreak: 7,
    userAiProvider: "openai",
    userApiKeyEncrypted: null,
    userModel: "gpt-4o-mini",
  };

  describe("generateAINarrativeSummary", () => {
    it("should generate AI narrative for Standard tier", async () => {
      const result = await generateAINarrativeSummary(baseMetrics);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle zero actions gracefully", async () => {
      const metrics = { ...baseMetrics, actionsCompleted: 0 };
      const result = await generateAINarrativeSummary(metrics);
      
      expect(result).toContain("quiet");
    });
  });

  describe("generateEnhancedAINarrativeSummary", () => {
    it("should generate enhanced AI narrative for Premium tier", async () => {
      const result = await generateEnhancedAINarrativeSummary(baseMetrics);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should include reply rate in context", async () => {
      const metrics = { ...baseMetrics, replies: 5, actionsCompleted: 10 };
      const result = await generateEnhancedAINarrativeSummary(metrics);
      
      expect(result).toBeDefined();
    });
  });

  describe("generateAIInsight", () => {
    it("should generate AI insight for Standard tier", async () => {
      const result = await generateAIInsight(baseMetrics);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle zero actions", async () => {
      const metrics = { ...baseMetrics, actionsCompleted: 0 };
      const result = await generateAIInsight(metrics);
      
      expect(result).toContain("momentum");
    });
  });

  describe("generateEnhancedAIInsights", () => {
    it("should generate multiple insights for Premium tier", async () => {
      const result = await generateEnhancedAIInsights(baseMetrics);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should return at least one insight even on error", async () => {
      const metrics = { ...baseMetrics, actionsCompleted: 0 };
      const result = await generateEnhancedAIInsights(metrics);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("generateAINextWeekFocus", () => {
    it("should generate AI next week focus for Standard tier", async () => {
      const result = await generateAINextWeekFocus(baseMetrics);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("generateEnhancedAINextWeekFocus", () => {
    it("should generate enhanced AI next week focus for Premium tier", async () => {
      const result = await generateEnhancedAINextWeekFocus(baseMetrics);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });
});

