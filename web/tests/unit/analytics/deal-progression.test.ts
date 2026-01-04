import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateDealProgression } from "@/lib/analytics/deal-progression";

function createFakeSupabase(actions: any[]): SupabaseClient {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        gte() {
          return this;
        },
        lte() {
          return this;
        },
        not() {
          return this;
        },
        async then(resolve: any) {
          // Vitest/Vitest's Supabase client is not awaited directly in our code,
          // we call .then on the query result when awaiting, so we implement then.
          return resolve({ data: actions, error: null });
        },
      } as any;
    },
  } as any;
}

describe("calculateDealProgression", () => {
  it("calculates basic metrics from actions with deal stages and values", async () => {
    const actions = [
      { deal_stage: "prospecting", deal_value: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { deal_stage: "qualifying", deal_value: 200, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { deal_stage: "closed_won", deal_value: 300, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { deal_stage: "closed_lost", deal_value: 150, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    const supabase = createFakeSupabase(actions);
    const metrics = await calculateDealProgression(
      supabase as unknown as SupabaseClient,
      "user-1",
      undefined,
      undefined
    );

    expect(metrics.totalDeals).toBe(actions.length);
    expect(metrics.byStage.prospecting).toBe(1);
    expect(metrics.byStage.qualifying).toBe(1);
    expect(metrics.byStage.closed_won).toBe(1);
    expect(metrics.byStage.closed_lost).toBe(1);
    expect(metrics.totalValue).toBe(100 + 200 + 300 + 150);
    expect(metrics.averageDealValue).toBeCloseTo(
      (100 + 200 + 300 + 150) / actions.length,
      2
    );
    expect(metrics.winRate).toBeCloseTo(1 / 2, 2);
  });
});
