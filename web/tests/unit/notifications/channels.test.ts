import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationChannels } from "@/lib/notifications/channels";

function createFakeSupabase(options: {
  user?: { email_unsubscribed?: boolean; email_morning_plan?: boolean } | null;
  prefs?: Record<string, unknown> | null;
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
        async single() {
          if (table === "users") {
            return {
              data: options.user ?? { email_unsubscribed: false },
              error: null,
            } as any;
          }
          if (table === "notification_preferences") {
            if (!options.prefs) {
              // Simulate no row found (PGRST116) so code falls back
              return { data: null, error: { code: "PGRST116" } } as any;
            }
            return { data: options.prefs, error: null } as any;
          }
          return { data: null, error: null } as any;
        },
      } as any;
    },
  } as any;
}

describe("getNotificationChannels", () => {
  it("returns both channels disabled when user is globally unsubscribed", async () => {
    const supabase = createFakeSupabase({ user: { email_unsubscribed: true } });

    const result = await getNotificationChannels(
      supabase as unknown as SupabaseClient,
      "user-1",
      "morning_plan"
    );

    expect(result).toEqual({ email: false, push: false });
  });

  it("returns email only when prefs not present (fallback to defaults)", async () => {
    const supabase = createFakeSupabase({
      user: { email_unsubscribed: false, email_morning_plan: true },
      prefs: null,
    });

    const result = await getNotificationChannels(
      supabase as unknown as SupabaseClient,
      "user-1",
      "morning_plan"
    );

    expect(result.email).toBe(true);
    expect(result.push).toBe(false);
  });

  it("returns configured channels when prefs exist", async () => {
    const supabase = createFakeSupabase({
      user: { email_unsubscribed: false },
      prefs: {
        morning_plan_email: true,
        morning_plan_push: true,
      },
    });

    const result = await getNotificationChannels(
      supabase as unknown as SupabaseClient,
      "user-1",
      "morning_plan"
    );

    expect(result).toEqual({ email: true, push: true });
  });
});
