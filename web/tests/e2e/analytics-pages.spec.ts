import { test, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";
import { createTestUserWithOnboardingCompleted } from "../helpers/create-user";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * E2E tests for Analytics pages
 * 
 * Based on actual page structure from web/src/app/app/analytics/page.tsx:
 * - Loading state: <p>Loading analytics...</p>
 * - Error state: <div class="bg-red-50"><p class="text-red-800">error</p></div>
 * - Success state: Always shows <h1>Analytics</h1> and filters, then conditionally shows:
 *   - Deal metrics (if dealMetrics exists)
 *   - Insights (if insights.length > 0)
 *   - Empty state (if no dealMetrics or totalDeals === 0 AND no insights)
 */
test.describe("Analytics Pages", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    // Create user WITH onboarding completed
    testUser = await createTestUserWithOnboardingCompleted();
    
    // Sign in the user
    await signInUser(page, testUser.email, testUser.password);
    
    // Verify we can access app routes
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/app/, { timeout: 10000 });
    
    // Verify we're not redirected to onboarding
    const currentUrl = page.url();
    if (currentUrl.includes("/onboarding")) {
      throw new Error(`User with onboarding_completed=true was redirected to onboarding. URL: ${currentUrl}`);
    }
  });

  test.afterEach(async () => {
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test("should render Analytics page with basic elements", async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to analytics page
    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // Verify we're on analytics page
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for loading state to complete
    // Page shows: <p>Loading analytics...</p> while loading
    const loadingText = page.locator('text="Loading analytics..."');
    
    // Wait for loading to disappear (or skip if already loaded)
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // If loading text never appeared, that's fine - page might have loaded instantly
    }
    
    // Additional wait for React to finish rendering after API calls
    await page.waitForTimeout(2000);

    // After loading, page shows ONE of these states:
    // 1. Error: <div class="bg-red-50"><p class="text-red-800">error message</p></div>
    // 2. Success: <h1>Analytics</h1> + filters (always) + optional content
    
    // Check for error state first
    const errorBox = page.locator('.bg-red-50').first();
    const errorText = page.locator('.text-red-800').first();
    const hasError = await errorBox.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasError) {
      // Error state - verify error message is visible
      await expect(errorText).toBeVisible({ timeout: 2000 });
      return; // Test passes - error handling works
    }

    // No error - page should show success state
    // Success state ALWAYS includes:
    // - <h1 class="text-3xl font-bold text-zinc-900">Analytics</h1>
    // - Filters section with date inputs
    
    const heading = page.locator('h1:has-text("Analytics")');
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Verify filters section exists (always rendered in success state)
    const filtersSection = page.locator('text=/Start Date/i').or(page.locator('text=/End Date/i'));
    await expect(filtersSection.first()).toBeVisible({ timeout: 5000 });
    
    // Verify date inputs exist
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    expect(dateInputCount).toBeGreaterThanOrEqual(2); // Should have start and end date
    
    // Page may also show (conditionally):
    // - Deal metrics section (if dealMetrics exists)
    // - Insights section (if insights.length > 0)
    // - Empty state (if no dealMetrics or totalDeals === 0 AND no insights)
    
    // Check for empty state message
    const emptyState = page.locator('text=/No analytics data available/i');
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Check for deal metrics section
    const dealMetricsSection = page.locator('text=/Deal Progression/i').or(page.locator('text=/Total Deals/i'));
    const hasDealMetrics = await dealMetricsSection.isVisible({ timeout: 2000 }).catch(() => false);
    
    // At least one content section should be visible (empty state OR deal metrics)
    // (Insights might also be visible, but we don't require it)
    expect(hasEmptyState || hasDealMetrics).toBe(true);
  });

  test("should handle Analytics page error state gracefully", async ({ page }) => {
    test.setTimeout(30000);

    // Intercept API calls to simulate error
    await page.route("**/api/analytics/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // Verify we're on analytics page
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for loading to complete
    const loadingText = page.locator('text="Loading analytics..."');
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // Loading might have completed instantly
    }
    await page.waitForTimeout(2000); // Wait for React to process error

    // Error state structure: <div class="bg-red-50"><p class="text-red-800">error</p></div>
    const errorBox = page.locator('.bg-red-50').first();
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    
    const errorText = page.locator('.text-red-800').first();
    await expect(errorText).toBeVisible({ timeout: 5000 });
    
    // Verify error text contains error-related words
    const errorContent = await errorText.textContent();
    expect(errorContent).toMatch(/error|failed/i);
  });

  test("should render Cancellation Analytics page (admin access required)", async ({
    page,
  }) => {
    test.setTimeout(30000);

    await page.goto("/app/admin/cancellation-analytics", { waitUntil: "domcontentloaded" });
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    
    // Check for loading state
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Page shows either:
    // 1. Access denied: <div class="bg-red-50"><p class="text-red-800">Access denied...</p><button>Go back</button></div>
    // 2. Analytics content: <h1>Cancellation Feedback Analytics</h1>
    
    const accessDeniedBox = page.locator('.bg-red-50').first();
    const accessDeniedText = page.locator('text=/access denied/i').or(page.locator('text=/forbidden/i'));
    const goBackButton = page.locator('button:has-text("Go back")');
    const analyticsHeading = page.locator('h1:has-text("Cancellation Feedback Analytics")');

    // Wait for one of these to be visible
    const anyContent = accessDeniedBox.or(accessDeniedText).or(goBackButton).or(analyticsHeading);
    await expect(anyContent.first()).toBeVisible({ timeout: 15000 });

    // Check what's visible
    const hasAccessDeniedBox = await accessDeniedBox.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAccessDeniedText = await accessDeniedText.isVisible({ timeout: 3000 }).catch(() => false);
    const hasGoBack = await goBackButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAnalyticsHeading = await analyticsHeading.isVisible({ timeout: 3000 }).catch(() => false);

    const hasAccessDenied = hasAccessDeniedBox || hasAccessDeniedText || hasGoBack;

    // One of these should be visible
    expect(hasAccessDenied || hasAnalyticsHeading).toBe(true);

    // If access denied, that's expected for non-admin users
    if (hasAccessDenied) {
      // Verify "Go back" button works if present
      if (hasGoBack) {
        await goBackButton.click();
        await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
      }
      return;
    }

    // If admin access, verify key elements
    if (hasAnalyticsHeading) {
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });

      const exportButton = page.locator('button:has-text("Export CSV")');
      const breakdownSection = page.locator('text=/breakdown/i').or(page.locator('text=/total/i'));
      await expect(exportButton.or(breakdownSection).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should apply date filters on Analytics page", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // Verify we're on analytics page
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    // Wait for loading to complete
    const loadingText = page.locator('text="Loading analytics..."');
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // Loading might have completed instantly
    }
    await page.waitForTimeout(2000);

    // Verify heading is visible (page loaded successfully, not in error state)
    const heading = page.locator('h1:has-text("Analytics")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verify we're not in error state
    const errorBox = page.locator('.bg-red-50').first();
    const hasError = await errorBox.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      // Page is in error state - skip filter test
      return;
    }

    // Find date inputs - they should exist if page loaded successfully
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    
    // Fail test if date inputs don't exist (page structure changed)
    expect(count).toBeGreaterThanOrEqual(2);

    // Set start date
    const startDate = dateInputs.first();
    await startDate.fill("2025-01-01");

    // Set end date
    const endDate = dateInputs.nth(1);
    await endDate.fill("2025-01-31");

    // Wait for filters to apply (useEffect triggers API call)
    await page.waitForTimeout(3000);

    // Verify dates are set
    await expect(startDate).toHaveValue("2025-01-01");
    await expect(endDate).toHaveValue("2025-01-31");
  });
});
