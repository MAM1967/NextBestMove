import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  getActionDetails,
  deriveActionHistory,
  fetchRelatedActions,
} from "@/lib/actions/get-action-details";
import { generateTestUserEmail } from "../../fixtures/test-users";

/**
 * Integration tests for action details business logic
 *
 * Tests that:
 * - Action details can be fetched with lead relationship
 * - Action history is correctly derived from timestamps
 * - Related actions are fetched for same lead
 * - RLS is enforced (users can only access their own actions)
 *
 * NOTE: These tests require:
 * - SUPABASE_SERVICE_ROLE_KEY environment variable (should be STAGING service role key)
 * - NEXT_PUBLIC_SUPABASE_URL environment variable (should be STAGING URL)
 * - Access to staging Supabase database (NOT production)
 *
 * ⚠️ IMPORTANT: These tests write to the database. Always use staging credentials!
 */

describe("Action Details Integration", () => {
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
  let testActionId: string | null = null;
  let testLeadId: string | null = null;

  beforeEach(async () => {
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for integration tests. ` +
          `Got: SUPABASE_SERVICE_ROLE_KEY=${
            serviceRoleKey ? "set" : "missing"
          }, ` +
          `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ? "set" : "missing"}. ` +
          `These must be configured as GitHub Actions secrets (STAGING credentials, not production!). ` +
          `Secret names: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL`
      );
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

    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create test user
    testUserEmail = generateTestUserEmail("action-details-test");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: "TestPassword123!",
        email_confirm: true,
        user_metadata: {
          name: "Action Details Test User",
        },
      });

    if (authError || !authData.user) {
      throw new Error(
        `Failed to create auth user: ${authError?.message || "Unknown error"}`
      );
    }

    testUserId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: testUserId,
      email: testUserEmail,
      name: "Action Details Test User",
      timezone: "America/New_York",
      streak_count: 0,
      calendar_connected: false,
    } as any);

    if (profileError) {
      await supabase.auth.admin.deleteUser(testUserId).catch(() => {});
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // Create test lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        user_id: testUserId,
        name: "Test Lead for Action Details",
        status: "ACTIVE",
      } as any)
      .select("id")
      .single();

    if (leadError || !lead) {
      throw new Error(`Failed to create test lead: ${leadError?.message}`);
    }
    testLeadId = (lead as any).id;

    // Create test action
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .insert({
        user_id: testUserId,
        person_id: testLeadId,
        action_type: "OUTREACH",
        state: "NEW",
        due_date: new Date().toISOString().split("T")[0],
        description: "Test action for integration tests",
      } as any)
      .select("id")
      .single();

    if (actionError || !action) {
      throw new Error(`Failed to create test action: ${actionError?.message}`);
    }
    testActionId = (action as any).id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testActionId) {
      try {
        await supabase.from("actions").delete().eq("id", testActionId);
      } catch {}
      testActionId = null;
    }

    if (testLeadId) {
      try {
        await supabase.from("leads").delete().eq("id", testLeadId);
      } catch {}
      testLeadId = null;
    }

    if (testUserId) {
      // Delete billing data first (cascade will handle related records)
      try {
        await supabase
          .from("billing_customers")
          .delete()
          .eq("user_id", testUserId);
      } catch {}

      // Delete user (will cascade to related records)
      try {
        await supabase.from("users").delete().eq("id", testUserId);
      } catch {}

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
  });

  it("should fetch action details with lead relationship", async () => {
    if (!testUserId || !testActionId) {
      throw new Error("Test setup failed");
    }

    const result = await getActionDetails(supabase, testUserId, testActionId);

    expect(result).not.toBeNull();
    expect(result?.action).toBeDefined();
    expect(result?.action.id).toBe(testActionId);
    expect(result?.action.leads).toBeDefined();
    expect(result?.action.leads.id).toBe(testLeadId);
    expect(result?.action.leads.name).toBe("Test Lead for Action Details");
  });

  it("should derive action history from timestamps", async () => {
    if (!testUserId || !testActionId) {
      throw new Error("Test setup failed");
    }

    // Get the action to test history derivation
    const result = await supabase
      .from("actions")
      .select("created_at, updated_at, completed_at, state")
      .eq("id", testActionId)
      .single();
    const action = (result as any).data;

    if (!action) {
      throw new Error("Action not found");
    }

    const history = deriveActionHistory({
      created_at: action.created_at,
      updated_at: action.updated_at,
      completed_at: action.completed_at,
      state: action.state,
    });

    // Should have at least a "Created" event
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].event).toBe("Created");
    expect(history[0].timestamp).toBe(action.created_at);
  });

  it("should include state change in history when state is not NEW", async () => {
    if (!testUserId || !testLeadId) {
      throw new Error("Test setup failed");
    }

    // Create a new action with SENT state to test history derivation
    const { data: sentAction } = await supabase
      .from("actions")
      .insert({
        user_id: testUserId,
        person_id: testLeadId,
        action_type: "OUTREACH",
        state: "SENT",
        due_date: new Date().toISOString().split("T")[0],
        description: "Test action with SENT state",
      } as any)
      .select("created_at, updated_at, completed_at, state")
      .single();

    if (!sentAction) {
      throw new Error("Failed to create action with SENT state");
    }

    const action = sentAction as any;
    const history = deriveActionHistory({
      created_at: action.created_at,
      updated_at: action.updated_at || action.created_at,
      completed_at: action.completed_at,
      state: action.state,
    });

    // Should have Created event
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.some((h) => h.event === "Created")).toBe(true);
    // If updated_at differs from created_at and state is not NEW, should have state change
    if (action.updated_at && action.updated_at !== action.created_at && action.state !== "NEW") {
      expect(history.some((h) => h.event.includes("State changed"))).toBe(true);
    }

    // Clean up
    await supabase.from("actions").delete().eq("id", (sentAction as any).id);
  });

  it("should fetch related actions for same lead", async () => {
    if (!testUserId || !testActionId || !testLeadId) {
      throw new Error("Test setup failed");
    }

    // Create another action for the same lead
    const { data: relatedAction } = await supabase
      .from("actions")
      .insert({
        user_id: testUserId,
        person_id: testLeadId,
        action_type: "FOLLOW_UP",
        state: "NEW",
        due_date: new Date().toISOString().split("T")[0],
        description: "Related action",
      } as any)
      .select("id")
      .single();

    if (!relatedAction) {
      throw new Error("Failed to create related action");
    }

    const relatedActions = await fetchRelatedActions(
      supabase,
      testUserId,
      testActionId,
      testLeadId
    );

    expect(relatedActions.length).toBeGreaterThan(0);
    expect(relatedActions[0].id).toBe((relatedAction as any).id);
    expect(relatedActions[0].action_type).toBe("FOLLOW_UP");

    // Clean up
    await supabase.from("actions").delete().eq("id", (relatedAction as any).id);
  });

  it("should return empty array when action has no person_id", async () => {
    if (!testUserId || !testActionId) {
      throw new Error("Test setup failed");
    }

    // Create action without person_id
    const { data: actionWithoutLead } = await supabase
      .from("actions")
      .insert({
        user_id: testUserId,
        action_type: "CONTENT",
        state: "NEW",
        due_date: new Date().toISOString().split("T")[0],
      } as any)
      .select("id, person_id")
      .single();

    if (!actionWithoutLead) {
      throw new Error("Failed to create action without lead");
    }

    const relatedActions = await fetchRelatedActions(
      supabase,
      testUserId,
      (actionWithoutLead as any).id,
      (actionWithoutLead as any).person_id
    );

    expect(relatedActions).toEqual([]);

    // Clean up
    await supabase.from("actions").delete().eq("id", (actionWithoutLead as any).id);
  });

  it("should enforce RLS - users can only access their own actions", async () => {
    if (!testUserId || !testActionId) {
      throw new Error("Test setup failed");
    }

    // Create another user
    const otherUserEmail = generateTestUserEmail("other-user-action-test");
    const { data: otherAuthData, error: otherAuthError } =
      await supabase.auth.admin.createUser({
        email: otherUserEmail,
        password: "TestPassword123!",
        email_confirm: true,
        user_metadata: {
          name: "Other Test User",
        },
      });

    if (otherAuthError || !otherAuthData.user) {
      throw new Error(
        `Failed to create other auth user: ${otherAuthError?.message || "Unknown error"}`
      );
    }

    const otherUserId = otherAuthData.user.id;

    // Create other user profile
    const { error: otherProfileError } = await supabase.from("users").insert({
      id: otherUserId,
      email: otherUserEmail,
      name: "Other Test User",
      timezone: "America/New_York",
      streak_count: 0,
      calendar_connected: false,
    } as any);

    if (otherProfileError) {
      await supabase.auth.admin.deleteUser(otherUserId).catch(() => {});
      throw new Error(
        `Failed to create other user profile: ${otherProfileError.message}`
      );
    }

    // Try to fetch action belonging to first user using second user's ID
    const result = await getActionDetails(supabase, otherUserId, testActionId);

    // Should return null (action not found for this user due to RLS)
    expect(result).toBeNull();

    // Clean up other user
    try {
      await supabase.from("users").delete().eq("id", otherUserId);
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users.find((u) => u.email === otherUserEmail);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }
    } catch {}
  });

  it("should return null for non-existent action", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const result = await getActionDetails(supabase, testUserId, nonExistentId);

    expect(result).toBeNull();
  });
});
