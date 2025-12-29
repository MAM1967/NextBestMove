import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkFollowUpLimit } from "@/lib/billing/follow-up-limits";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("follow-up-limits", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
  });

  describe("checkFollowUpLimit", () => {
    it("should allow unlimited follow-ups for Standard tier", async () => {
      const result = await checkFollowUpLimit(mockSupabase, "user-id", "standard");
      
      expect(result.canCreate).toBe(true);
      expect(result.limit).toBe(Infinity);
      expect(result.currentCount).toBe(0);
    });

    it("should allow unlimited follow-ups for Premium tier", async () => {
      const result = await checkFollowUpLimit(mockSupabase, "user-id", "premium");
      
      expect(result.canCreate).toBe(true);
      expect(result.limit).toBe(Infinity);
      expect(result.currentCount).toBe(0);
    });

    it("should enforce 3 follow-ups per week limit for Free tier", async () => {
      // Mock user timezone
      mockSupabase.single.mockResolvedValueOnce({
        data: { timezone: "America/New_York" },
        error: null,
      });

      // Mock follow-up count (2 this week)
      mockSupabase.lte.mockResolvedValueOnce({
        count: 2,
        error: null,
      });

      const result = await checkFollowUpLimit(mockSupabase, "user-id", "free");
      
      expect(result.canCreate).toBe(true);
      expect(result.limit).toBe(3);
      expect(result.currentCount).toBe(2);
    });

    it("should block follow-up creation when Free tier limit reached", async () => {
      // Mock user timezone
      mockSupabase.single.mockResolvedValueOnce({
        data: { timezone: "America/New_York" },
        error: null,
      });

      // Mock follow-up count (3 this week - limit reached)
      mockSupabase.lte.mockResolvedValueOnce({
        count: 3,
        error: null,
      });

      const result = await checkFollowUpLimit(mockSupabase, "user-id", "free");
      
      expect(result.canCreate).toBe(false);
      expect(result.limit).toBe(3);
      expect(result.currentCount).toBe(3);
      expect(result.message).toContain("Free tier allows 3 follow-ups per week");
    });

    it("should handle errors gracefully (fail open)", async () => {
      // Mock user timezone
      mockSupabase.single.mockResolvedValueOnce({
        data: { timezone: "America/New_York" },
        error: null,
      });

      // Mock error when counting follow-ups
      mockSupabase.lte.mockResolvedValueOnce({
        count: null,
        error: new Error("Database error"),
      });

      const result = await checkFollowUpLimit(mockSupabase, "user-id", "free");
      
      // Should fail open (allow creation)
      expect(result.canCreate).toBe(true);
    });
  });
});

