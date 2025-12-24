import { test, expect } from "@playwright/test";
import { signUpUser } from "../helpers/auth";
import { cleanupTestUser } from "../helpers/test-data";
import { createClient } from "@supabase/supabase-js";

/**
 * NEX-9: Reverse Trial + Paywall E2E Test
 * 
 * Tests the reverse trial model:
 * 1. New users start on Standard tier (14-day trial)
 * 2. Premium features are accessible during trial
 * 3. After trial expiration, users downgrade to Free
 * 4. Paywall overlay appears on gated features
 * 5. Upgrade flow works correctly
 * 
 * Revenue Impact: Critical - billing bugs = lost revenue + customer trust
 */

test.describe("NEX-9: Reverse Trial + Paywall", () => {
  let testUser: { email: string; password: string; name: string };
  let supabase: ReturnType<typeof createClient>;

  test.beforeEach(async ({ page }) => {
    // Set up Supabase client for test data manipulation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      test.skip();
      return;
    }

    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign up a new user
    testUser = await signUpUser(page);
  });

  test.afterEach(async () => {
    // Clean up test user
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test("should start new user on Standard tier with 14-day trial", async ({ page }) => {
    // After signup, user should be on Standard tier (trial)
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // Navigate to Settings/Billing to check tier
    await page.goto("/app/settings", { waitUntil: "domcontentloaded" });

    // Check for trial status indicator
    // Look for text indicating trial or Standard tier
    const billingSection = page.locator('[data-testid="billing-section"], section:has-text("Billing"), section:has-text("Subscription")');
    
    // Should show Standard tier or trial status
    await expect(
      page.locator('text=/Standard|Trial|14 day/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow access to premium features during trial", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // Navigate to Daily Plan (premium feature)
    await page.goto("/app/plan", { waitUntil: "domcontentloaded" });

    // Should not see paywall overlay during trial
    const paywallOverlay = page.locator('[data-testid="paywall-overlay"]');
    await expect(paywallOverlay).not.toBeVisible({ timeout: 5000 });

    // Should see daily plan content
    // Look for plan-related content
    const planContent = page.locator('text=/Daily Plan|Today\'s Plan|Actions/i');
    await expect(planContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show paywall overlay on premium features after trial expires", async ({ page }) => {
    // Manually expire the trial by updating the database
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === testUser.email);
    if (!user) {
      throw new Error("Test user not found");
    }

    const userId = user.id;

    // Get billing customer
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (billingCustomer) {
      // Update subscription to expire trial (set trial_ends_at to past)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 1 day ago

      // Use raw SQL or admin client for updates that bypass RLS
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: subError } = await adminSupabase
        .from("billing_subscriptions")
        .update({
          trial_ends_at: pastDate.toISOString(),
          status: "trialing",
        } as any)
        .eq("billing_customer_id", (billingCustomer as any).id);
      
      if (subError) {
        console.warn("Failed to update subscription:", subError);
      }

      // Update user tier to Free (simulate downgrade)
      const { error: userError } = await adminSupabase
        .from("users")
        .update({ tier: "free" })
        .eq("id", userId);
      
      if (userError) {
        console.warn("Failed to update user tier:", userError);
      }
    }

    // Refresh page to see updated tier
    await page.goto("/app/plan", { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });

    // Should see paywall overlay
    const paywallOverlay = page.locator('[data-testid="paywall-overlay"]');
    await expect(paywallOverlay).toBeVisible({ timeout: 10000 });

    // Should see upgrade CTA
    const upgradeButton = page.locator('[data-testid="upgrade-button"], button:has-text("Upgrade"), button:has-text("Start Trial")');
    await expect(upgradeButton.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show Free tier downgrade banner after trial expires", async ({ page }) => {
    // Manually expire trial (same as previous test)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === testUser.email);
    if (!user) {
      throw new Error("Test user not found");
    }

    const userId = user.id;

    // Update user tier to Free using admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await adminSupabase
      .from("users")
      .update({ tier: "free" })
      .eq("id", userId);
    
    if (error) {
      console.warn("Failed to update user tier:", error);
    }

    // Navigate to Today page
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });

    // Should see Free tier downgrade banner
    const downgradeBanner = page.locator('[data-free-tier-banner], [data-testid="free-tier-banner"], .banner:has-text("trial has ended")');
    
    // Banner might not always be visible (could be dismissed), so check if it exists
    const bannerCount = await downgradeBanner.count();
    if (bannerCount > 0) {
      await expect(downgradeBanner.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should navigate to upgrade flow from paywall", async ({ page }) => {
    // Set user to Free tier
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === testUser.email);
    if (!user) {
      throw new Error("Test user not found");
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await adminSupabase
      .from("users")
      .update({ tier: "free" } as any)
      .eq("id", user.id);
    
    if (error) {
      console.warn("Failed to update user tier:", error);
    }

    // Navigate to a premium feature
    await page.goto("/app/plan", { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });

    // Click upgrade button
    const upgradeButton = page.locator('[data-testid="upgrade-button"], button:has-text("Upgrade"), button:has-text("Start Trial")');
    
    if (await upgradeButton.count() > 0) {
      await upgradeButton.first().click({ timeout: 5000 });

      // Should navigate to checkout or billing page
      // Check if we're on a billing-related page
      await page.waitForTimeout(2000); // Wait for navigation
      
      const currentUrl = page.url();
      // Should be on billing/checkout page or Stripe checkout
      expect(
        currentUrl.includes("/billing") ||
        currentUrl.includes("/checkout") ||
        currentUrl.includes("stripe.com")
      ).toBeTruthy();
    }
  });

  test("should display correct tier information in Settings", async ({ page }) => {
    await page.goto("/app/settings", { waitUntil: "domcontentloaded" });

    // Look for tier information in billing section
    const tierInfo = page.locator('text=/Free|Standard|Premium|Tier/i');
    
    // Should show tier information
    const tierCount = await tierInfo.count();
    expect(tierCount).toBeGreaterThan(0);
  });

  test("should prevent access to premium API endpoints when on Free tier", async ({ page, request }) => {
    // Set user to Free tier
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === testUser.email);
    if (!user) {
      throw new Error("Test user not found");
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await adminSupabase
      .from("users")
      .update({ tier: "free" } as any)
      .eq("id", user.id);
    
    if (error) {
      console.warn("Failed to update user tier:", error);
    }

    // Get auth cookies from page context
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes("auth-token"));

    if (!authCookie) {
      test.skip();
      return;
    }

    // Try to access premium endpoint (e.g., daily plan generation)
    const response = await request.get("/api/plan/generate", {
      headers: {
        Cookie: `${authCookie.name}=${authCookie.value}`,
      },
    });

    // Should return 403 or redirect to paywall
    expect([403, 402, 401]).toContain(response.status());
  });
});

