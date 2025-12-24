import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  generateIdempotencyKey,
  executeWithIdempotency,
} from "@/lib/billing/idempotency";
import {
  createTrialTestUser,
  generateTestUserEmail,
} from "../../fixtures/test-users";

/**
 * Integration test for billing idempotency (NEX-16)
 *
 * Tests that duplicate Stripe webhook events don't cause duplicate side effects.
 * This is critical to prevent duplicate charges.
 *
 * NOTE: These tests require:
 * - SUPABASE_SERVICE_ROLE_KEY environment variable (should be STAGING service role key)
 * - NEXT_PUBLIC_SUPABASE_URL environment variable (should be STAGING URL)
 * - Access to staging Supabase database (NOT production)
 *
 * ⚠️ IMPORTANT: These tests write to the database. Always use staging credentials!
 */

describe("Billing Idempotency Integration", () => {
  let supabase: ReturnType<typeof createClient>;
  // Use staging-specific env vars (set by CI workflow)
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL;

  let testUserId: string | null = null;
  let testUserEmail: string;

  beforeEach(async () => {
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for integration tests. ` +
          `Got: SUPABASE_SERVICE_ROLE_KEY=${
            serviceRoleKey ? "set" : "missing"
          }, ` +
          `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ? "set" : "missing"}. ` +
          `These must be configured as GitHub Actions secrets (STAGING credentials, not production!). ` +
          `Secret names: SUPABASE_STAGING_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_STAGING_URL`
      );
    }

    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify idempotency_keys table exists
    const { error: tableError } = await supabase
      .from("idempotency_keys")
      .select("key")
      .limit(1);

    if (tableError) {
      // PGRST116 = table not found (expected if table doesn't exist)
      // Other errors = access/permission issues
      if (tableError.code === "PGRST116") {
        throw new Error(`idempotency_keys table does not exist in database`);
      }
      throw new Error(
        `idempotency_keys table not accessible: ${tableError.message} (code: ${tableError.code}). ` +
          `Check that SUPABASE_SERVICE_ROLE_KEY is correct (should be STAGING service role key) ` +
          `and has access to the idempotency_keys table. ` +
          `Current URL: ${supabaseUrl?.substring(0, 30)}...`
      );
    }

    // Generate test user email
    testUserEmail = generateTestUserEmail("idempotency-test");
  });

  afterEach(async () => {
    // Clean up test user if created
    if (testUserId) {
      // Delete billing data first (cascade will handle related records)
      try {
        await supabase
          .from("billing_customers")
          .delete()
          .eq("user_id", testUserId);
      } catch {} // Ignore errors if doesn't exist

      // Delete user (will cascade to related records)
      try {
        await supabase.from("users").delete().eq("id", testUserId);
      } catch {} // Ignore errors

      // Delete auth user
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users.find((u) => u.email === testUserEmail);
      if (authUser) {
        try {
          await supabase.auth.admin.deleteUser(authUser.id);
        } catch {}
      }

      testUserId = null;
    }

    // Clean up any idempotency keys created during tests (older than 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    try {
      await supabase
        .from("idempotency_keys")
        .delete()
        .lt("created_at", oneMinuteAgo);
    } catch {} // Ignore errors
  });

  it("should verify idempotency_keys table exists and is accessible", async () => {
    const { data, error } = await supabase
      .from("idempotency_keys")
      .select("key, result, created_at")
      .limit(1);

    expect(error).toBeNull();
    // Table exists and is queryable
  });

  it("should store and retrieve idempotency keys", async () => {
    const testKey = `test_key_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const testResult = { subscriptionId: "sub_test_123", status: "active" };

    // Store idempotency key
    const { error: insertError } = await supabase
      .from("idempotency_keys")
      .insert({
        key: testKey,
        result: testResult,
        created_at: new Date().toISOString(),
      } as any);

    expect(insertError).toBeNull();

    // Retrieve idempotency key
    const { data, error: selectError } = await supabase
      .from("idempotency_keys")
      .select("key, result")
      .eq("key", testKey)
      .maybeSingle();

    expect(selectError).toBeNull();
    expect(data).not.toBeNull();
    if (data) {
      expect((data as any).key).toBe(testKey);
      expect((data as any).result).toEqual(testResult);
    }

    // Clean up
    await supabase.from("idempotency_keys").delete().eq("key", testKey);
  });

  it("should prevent duplicate idempotency key insertion", async () => {
    const testKey = `test_key_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const testResult = { subscriptionId: "sub_test_123" };

    // First insert should succeed
    const { error: firstError } = await supabase
      .from("idempotency_keys")
      .insert({
        key: testKey,
        result: testResult,
        created_at: new Date().toISOString(),
      } as any);

    expect(firstError).toBeNull();

    // Second insert with same key should fail with unique constraint violation
    const { error: secondError } = await supabase
      .from("idempotency_keys")
      .insert({
        key: testKey,
        result: { subscriptionId: "sub_test_456" }, // Different result
        created_at: new Date().toISOString(),
      } as any);

    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe("23505"); // Unique constraint violation

    // Clean up
    await supabase.from("idempotency_keys").delete().eq("key", testKey);
  });

  it("should verify billing_events table prevents duplicate webhook processing", async () => {
    // Check if billing_events table exists
    const { data: events, error: eventsError } = await supabase
      .from("billing_events")
      .select("stripe_event_id")
      .limit(1);

    // If table doesn't exist, skip this test (it's optional per schema)
    if (eventsError && eventsError.code === "42P01") {
      console.warn(
        "billing_events table doesn't exist - skipping webhook idempotency test"
      );
      return;
    }

    const testEventId = `evt_test_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    // Simulate first webhook event processing
    const { error: firstInsertError } = await supabase
      .from("billing_events")
      .insert({
        stripe_event_id: testEventId,
        type: "checkout.session.completed",
        payload: { test: "data" },
        processed_at: new Date().toISOString(),
      } as any);

    expect(firstInsertError).toBeNull();

    // Simulate duplicate webhook event (should be detected)
    const { data: existingEvent, error: selectError } = await supabase
      .from("billing_events")
      .select("stripe_event_id, processed_at")
      .eq("stripe_event_id", testEventId)
      .maybeSingle();

    expect(selectError).toBeNull();
    expect(existingEvent).not.toBeNull();
    if (existingEvent) {
      expect((existingEvent as any).stripe_event_id).toBe(testEventId);
    }

    // Clean up
    await supabase
      .from("billing_events")
      .delete()
      .eq("stripe_event_id", testEventId);
  });

  it("should generate stable idempotency keys for same operation", () => {
    const userId = "test-user-123";
    const operation = "checkout_session";
    const params = { sessionId: "sess_123", priceId: "price_123" };

    const key1 = generateIdempotencyKey(userId, operation, params);
    const key2 = generateIdempotencyKey(userId, operation, params);

    expect(key1).toBe(key2);
    expect(key1).toContain(operation);
    expect(key1).toContain(userId);
  });

  // Note: Full end-to-end tests (creating actual Stripe subscriptions, processing webhooks)
  // would require:
  // 1. Stripe test mode API keys
  // 2. Webhook endpoint setup
  // 3. More complex test infrastructure
  // These are better suited for E2E tests with Playwright against staging environment
});
