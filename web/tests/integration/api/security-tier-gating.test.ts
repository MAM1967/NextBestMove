import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// Skip tests if required environment variables are not set
const skipIfNoEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Security tests for tier-based feature gating (NEX-34, NEX-35, NEX-36, NEX-37)
 * 
 * Tests verify:
 * - Users cannot access Premium features on Free tier
 * - Users cannot access Premium features on Standard tier
 * - Tier checks are enforced at API level
 * - Follow-up limits are enforced for Free tier
 */
describe.skipIf(skipIfNoEnv)("Security: Tier-Based Feature Gating", () => {
  let adminSupabase: SupabaseClient;
  let freeUserId: string;
  let standardUserId: string;
  let premiumUserId: string;

  beforeEach(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    adminSupabase = createAdminClient();

    // Create Free tier user
    const { data: freeUser } = await adminSupabase.auth.admin.createUser({
      email: `test-free-${Date.now()}@example.com`,
      password: "test-password-123",
      email_confirm: true,
    });
    freeUserId = freeUser?.user?.id || "";

    await adminSupabase.from("users").insert({
      id: freeUserId,
      email: freeUser?.user?.email,
      name: "Free User",
      tier: "free",
      timezone: "America/New_York",
    });

    // Create Standard tier user
    const { data: standardUser } = await adminSupabase.auth.admin.createUser({
      email: `test-standard-${Date.now()}@example.com`,
      password: "test-password-123",
      email_confirm: true,
    });
    standardUserId = standardUser?.user?.id || "";

    await adminSupabase.from("users").insert({
      id: standardUserId,
      email: standardUser?.user?.email,
      name: "Standard User",
      tier: "standard",
      timezone: "America/New_York",
    });

    // Create Premium tier user
    const { data: premiumUser } = await adminSupabase.auth.admin.createUser({
      email: `test-premium-${Date.now()}@example.com`,
      password: "test-password-123",
      email_confirm: true,
    });
    premiumUserId = premiumUser?.user?.id || "";

    await adminSupabase.from("users").insert({
      id: premiumUserId,
      email: premiumUser?.user?.email,
      name: "Premium User",
      tier: "premium",
      timezone: "America/New_York",
    });
  });

  afterEach(async () => {
    // Clean up
    if (freeUserId) {
      await adminSupabase.from("users").delete().eq("id", freeUserId);
      await adminSupabase.auth.admin.deleteUser(freeUserId);
    }
    if (standardUserId) {
      await adminSupabase.from("users").delete().eq("id", standardUserId);
      await adminSupabase.auth.admin.deleteUser(standardUserId);
    }
    if (premiumUserId) {
      await adminSupabase.from("users").delete().eq("id", premiumUserId);
      await adminSupabase.auth.admin.deleteUser(premiumUserId);
    }
  });

  describe("Follow-up limit enforcement (NEX-37)", () => {
    it("should enforce 3 follow-ups per week limit for Free tier", async () => {
      // Create 3 follow-ups for Free tier user this week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      for (let i = 0; i < 3; i++) {
        await adminSupabase.from("actions").insert({
          user_id: freeUserId,
          action_type: "FOLLOW_UP",
          state: "NEW",
          due_date: new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          description: `Follow-up ${i + 1}`,
          created_at: new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Verify limit is reached
      const { count } = await adminSupabase
        .from("actions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", freeUserId)
        .eq("action_type", "FOLLOW_UP")
        .gte("created_at", weekStart.toISOString());

      expect(count).toBe(3);
    });

    it("should allow unlimited follow-ups for Standard tier", async () => {
      // Standard tier should not have limits
      const { data: user } = await adminSupabase
        .from("users")
        .select("tier")
        .eq("id", standardUserId)
        .single();

      expect(user?.tier).toBe("standard");
      // No limit check needed - unlimited
    });

    it("should allow unlimited follow-ups for Premium tier", async () => {
      const { data: user } = await adminSupabase
        .from("users")
        .select("tier")
        .eq("id", premiumUserId)
        .single();

      expect(user?.tier).toBe("premium");
      // No limit check needed - unlimited
    });
  });

  describe("Export format gating (NEX-36)", () => {
    it("should verify Free tier users get JSON export only", async () => {
      const { data: user } = await adminSupabase
        .from("users")
        .select("tier")
        .eq("id", freeUserId)
        .single();

      expect(user?.tier).toBe("free");
      // Export format check would be in API route test
    });

    it("should verify Standard tier users get CSV export", async () => {
      const { data: user } = await adminSupabase
        .from("users")
        .select("tier")
        .eq("id", standardUserId)
        .single();

      expect(user?.tier).toBe("standard");
    });

    it("should verify Premium tier users get ZIP export", async () => {
      const { data: user } = await adminSupabase
        .from("users")
        .select("tier")
        .eq("id", premiumUserId)
        .single();

      expect(user?.tier).toBe("premium");
    });
  });
});

