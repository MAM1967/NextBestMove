import { describe, it, expect } from "vitest";
import { getActionForDuration } from "@/lib/decision-engine/duration-filter";
import type { ActionWithLane } from "@/lib/decision-engine/types";

describe("Duration Filter", () => {
  const createMockAction = (
    id: string,
    estimatedMinutes: number | null | undefined,
    lane: "priority" | "in_motion" | "on_deck" = "priority",
    score: number = 50
  ): ActionWithLane => ({
    id,
    user_id: "user-1",
    action_type: "FOLLOW_UP",
    state: "NEW",
    due_date: new Date().toISOString(),
    auto_created: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    estimated_minutes: estimatedMinutes,
    lane,
    next_move_score: score,
    leads: { id: "lead-1", name: "Test Lead", url: "https://example.com" },
  });

  describe("getActionForDuration", () => {
    it("should return null when no actions provided", () => {
      expect(getActionForDuration([], 5)).toBeNull();
      expect(getActionForDuration([], 10)).toBeNull();
    });

    it("should return best action when duration is large (simulating 'any')", () => {
      const actions = [
        createMockAction("1", 10, "priority", 90),
        createMockAction("2", 20, "in_motion", 80),
      ];
      // Test with a large duration to simulate "any duration"
      const result = getActionForDuration(actions, 999);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1"); // Highest score in Priority lane
    });

    it("should filter actions by estimated_minutes <= duration", () => {
      const actions = [
        createMockAction("1", 5, "priority", 90),
        createMockAction("2", 10, "in_motion", 80),
        createMockAction("3", 15, "on_deck", 70),
        createMockAction("4", 30, "priority", 60), // Too long
      ];

      const result = getActionForDuration(actions, 10);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1"); // Highest score among actions <= 10 min
      expect(result?.estimated_minutes).toBeLessThanOrEqual(10);
    });

    it("should prioritize Priority lane over In Motion over On Deck", () => {
      const actions = [
        createMockAction("1", 10, "on_deck", 90), // High score but On Deck
        createMockAction("2", 10, "in_motion", 80), // Medium score, In Motion
        createMockAction("3", 10, "priority", 70), // Lower score but Priority
      ];

      const result = getActionForDuration(actions, 10);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("3"); // Priority lane wins
      expect(result?.lane).toBe("priority");
    });

    it("should use score as tiebreaker within same lane", () => {
      const actions = [
        createMockAction("1", 10, "priority", 70),
        createMockAction("2", 10, "priority", 90), // Higher score
        createMockAction("3", 10, "priority", 80),
      ];

      const result = getActionForDuration(actions, 10);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("2"); // Highest score in Priority lane
    });

    it("should exclude actions without estimated_minutes when filtering by duration", () => {
      const actions = [
        createMockAction("1", null, "priority", 90), // No estimated_minutes
        createMockAction("2", 10, "in_motion", 80),   // Has estimated_minutes
      ];

      // Actions without estimated_minutes should be excluded when filtering by duration
      // Even with large duration, action 1 (null) will be excluded
      const result = getActionForDuration(actions, 999);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("2"); // Only action 2 has estimated_minutes
    });

    it("should return null when no actions fit the duration", () => {
      const actions = [
        createMockAction("1", 20, "priority", 90),
        createMockAction("2", 30, "in_motion", 80),
      ];

      const result = getActionForDuration(actions, 10);
      expect(result).toBeNull();
    });

    it("should handle edge case: exactly matching duration", () => {
      const actions = [
        createMockAction("1", 5, "priority", 90),
        createMockAction("2", 10, "in_motion", 80),
        createMockAction("3", 15, "on_deck", 70),
      ];

      const result = getActionForDuration(actions, 10);
      expect(result).not.toBeNull();
      expect(result?.estimated_minutes).toBeLessThanOrEqual(10);
      // Should prefer Priority lane (action 1) even though action 2 also fits
      expect(result?.id).toBe("1");
    });
  });
});

