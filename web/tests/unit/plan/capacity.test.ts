import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Minimal fake Supabase client implementing the subset used by getCapacityWithOverrides
function createFakeSupabase(overrides: {
  dailyPlan?: { capacity_override?: string | null; override_reason?: string | null } | null;
  userDefault?: { default_capacity_override?: string | null } | null;
}): SupabaseClient {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          if (table === "daily_plans") {
            return { data: overrides.dailyPlan ?? null, error: null } as any;
          }
          return { data: null, error: null } as any;
        },
        async single() {
          if (table === "users") {
            return { data: overrides.userDefault ?? null, error: null } as any;
          }
          return { data: null, error: null } as any;
        },
      } as any;
    },
  } as any;
}

beforeEach(() => {
  vi.resetModules();
});

describe("getCapacityWithOverrides", () => {
  it("uses daily plan override when present", async () => {
    const supabase = createFakeSupabase({
      dailyPlan: { capacity_override: "micro", override_reason: "busy" },
      userDefault: { default_capacity_override: "heavy" },
    });

    const getCapacityForDate = vi.fn().mockResolvedValue({
      level: "standard",
      actionsPerDay: 6,
      source: "calendar",
    });

    vi.doMock("@/lib/calendar/capacity", () => ({
      getCapacityForDate,
    }));

    const { getCapacityWithOverrides } = await import("@/lib/plan/capacity");
    const result = await getCapacityWithOverrides(
      supabase as unknown as SupabaseClient,
      "user-1",
      "2025-12-29"
    );

    expect(result.level).toBe("micro");
    expect(result.actionCount).toBe(2);
    expect(result.source).toBe("override");
    expect(getCapacityForDate).not.toHaveBeenCalled();
  });

  it("falls back to user default when no daily override", async () => {
    const supabase = createFakeSupabase({
      dailyPlan: null,
      userDefault: { default_capacity_override: "light" },
    });

    const getCapacityForDate = vi.fn().mockResolvedValue({
      level: "heavy",
      actionsPerDay: 8,
      source: "calendar",
    });

    vi.doMock("@/lib/calendar/capacity", () => ({
      getCapacityForDate,
    }));

    const { getCapacityWithOverrides } = await import("@/lib/plan/capacity");
    const result = await getCapacityWithOverrides(
      supabase as unknown as SupabaseClient,
      "user-1",
      "2025-12-29"
    );

    expect(result.level).toBe("light");
    expect(result.actionCount).toBe(4);
    expect(result.source).toBe("user_default");
  });

  it("uses calendar capacity when no overrides present", async () => {
    const supabase = createFakeSupabase({ dailyPlan: null, userDefault: null });

    const getCapacityForDate = vi.fn().mockResolvedValue({
      level: "standard",
      actionsPerDay: 6,
      source: "calendar",
    });

    vi.doMock("@/lib/calendar/capacity", () => ({
      getCapacityForDate,
    }));

    const { getCapacityWithOverrides } = await import("@/lib/plan/capacity");
    const result = await getCapacityWithOverrides(
      supabase as unknown as SupabaseClient,
      "user-1",
      "2025-12-29"
    );

    expect(result.level).toBe("standard");
    expect(result.actionCount).toBe(6);
    expect(result.source).toBe("calendar");
  });
});
