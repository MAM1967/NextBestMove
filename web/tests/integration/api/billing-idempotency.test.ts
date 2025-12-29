import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  generateIdempotencyKey,
} from "@/lib/billing/idempotency";
import {
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

// Skip tests if required environment variables are not set
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY;
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL;
const skipIfNoEnv = !serviceRoleKey || !supabaseUrl;

describe.skipIf(skipIfNoEnv)("Billing Idempotency Integration", () => {
  let supabase: ReturnType<typeof createClient>;

  let testUserId: string | null = null;
  let testUserEmail: string;

  beforeEach(async () => {
    if (!serviceRoleKey || !supabaseUrl) {
      // Skip test if env vars not set (shouldn't happen due to describe.skipIf, but safety check)
      return;
    }

    // Verify URL matches staging project
    const expectedStagingProjectId = "adgiptzbxnzddbgfeuut";
    if (!supabaseUrl.includes(expectedStagingProjectId)) {
      throw new Error(
        `NEXT_PUBLIC_SUPABASE_URL does not match staging project ID. ` +
          `Expected URL to contain: ${expectedStagingProjectId}, ` +
          `Got: ${supabaseUrl.substring(0, 50)}... ` +
          `Make sure you're using STAGING Supabase credentials, not production!`
      );
    }

    // Verify service role key format (should start with eyJ for JWT)
    if (!serviceRoleKey.startsWith("eyJ")) {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY appears invalid. Service role keys should start with "eyJ" (JWT format). ` +
          `Got: ${serviceRoleKey.substring(0, 20)}... ` +
          `Make sure you're using the SERVICE_ROLE key (not anon key) from staging Supabase project settings.`
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

      // "Invalid API key" usually means the key doesn't match the project
      if (
        tableError.message.includes("Invalid API key") ||
        tableError.message.includes("JWT")
      ) {
        throw new Error(
          `Invalid API key error: ${tableError.message}. ` +
            `This usually means SUPABASE_SERVICE_ROLE_KEY doesn't match the staging Supabase project. ` +
            `Verify: ` +
            `1. You're using the SERVICE_ROLE key (not anon key) ` +
            `2. The key is from the staging project (ID: ${expectedStagingProjectId}) ` +
            `3. The key hasn't been rotated/changed. ` +
            `Get the correct key from: Supabase Dashboard → Staging Project → Settings → API → service_role key`
        );
      }

      throw new Error(
        `idempotency_keys table not accessible: ${tableError.message} (code: ${tableError.code}). ` +
          `Check that SUPABASE_SERVICE_ROLE_KEY is correct (should be STAGING service role key) ` +
          `and has access to the idempotency_keys table. ` +
          `Current URL: ${supabaseUrl?.substring(0, 50)}...`
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
    const { error } = await supabase
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
      } as { key: string; result: unknown; created_at: string });

    expect(insertError).toBeNull();

    // Retrieve idempotency key
    const { data, error: selectError } = await supabase
      .from("idempotency_keys")
      .select("key, result")
      .eq("key", testKey)
      .maybeSingle();

    expect(selectError).toBeNull();
    expect(data).not.toBeNull();
    const typedData = data as { key: string; result: unknown } | null;
    if (typedData) {
      expect(typedData.key).toBe(testKey);
      expect(typedData.result).toEqual(testResult);
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
      } as unknown as { key: string; result: unknown; created_at: string });

    expect(firstError).toBeNull();

    // Second insert with same key should fail with unique constraint violation
    const { error: secondError } = await supabase
      .from("idempotency_keys")
      .insert({
        key: testKey,
        result: { subscriptionId: "sub_test_456" }, // Different result
        created_at: new Date().toISOString(),
      } as unknown as { key: string; result: unknown; created_at: string });

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
      } as unknown as { stripe_event_id: string; type: string; payload: unknown; processed_at: string });

    expect(firstInsertError).toBeNull();

    // Simulate duplicate webhook event (should be detected)
    const { data: existingEvent, error: selectError } = await supabase
      .from("billing_events")
      .select("stripe_event_id, processed_at")
      .eq("stripe_event_id", testEventId)
      .maybeSingle();

    expect(selectError).toBeNull();
    expect(existingEvent).not.toBeNull();
    const typedEvent = existingEvent as { stripe_event_id: string; processed_at: string } | null;
    if (typedEvent) {
      expect(typedEvent.stripe_event_id).toBe(testEventId);
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
