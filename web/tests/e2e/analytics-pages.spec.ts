import { test, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";
import { createTestUserWithOnboardingCompleted } from "../helpers/create-user";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * E2E tests for Analytics pages
 *
 * These tests verify:
 * - Analytics page renders correctly for users with completed onboarding
 * - Cancellation Analytics page shows access denied for non-admins (expected)
 * - Pages handle loading and error states
 * - Basic UI elements are present when content loads
 */
test.describe("Analytics Pages", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    // Create user WITH onboarding completed (so they can access /app routes)
    testUser = await createTestUserWithOnboardingCompleted();
    
    // Sign in the user
    await signInUser(page, testUser.email, testUser.password);
    
    // Verify we can access app routes (should NOT redirect to onboarding)
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/app/, { timeout: 10000 });
    
    // Verify we're not redirected to onboarding
    const currentUrl = page.url();
    if (currentUrl.includes("/onboarding")) {
      throw new Error(`User with onboarding_completed=true was redirected to onboarding. URL: ${currentUrl}`);
    }
  });

  test.afterEach(async () => {
    // Clean up test user
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test("should render Analytics page with basic elements", async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to analytics page
    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // CRITICAL: Verify we're on the analytics page (not redirected)
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for page to stabilize and network requests to complete
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {
      // Network idle might timeout if there are long-polling requests, that's okay
    });
    
    // Wait for loading state to complete
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      // Wait for loading to disappear
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      // Additional wait for React to re-render after loading completes
      await page.waitForTimeout(1000);
    }

    // After loading, the page should show one of these states:
    // 1. Heading "Analytics" (page loaded successfully)
    // 2. Error message (API failed)
    // 3. Empty state (no data)
    
    // Use more specific selectors based on actual page structure
    const heading = page.locator('h1:has-text("Analytics")');
    const errorBox = page.locator('.bg-red-50').first();
    const errorText = page.locator('.text-red-800').first();
    const emptyState = page.locator('text=/No analytics data available/i');
    
    // Wait for at least one of these to be visible
    // Use Playwright's built-in waiting with locator.or()
    const anyContent = heading.or(errorBox).or(errorText).or(emptyState);
    await expect(anyContent.first()).toBeVisible({ timeout: 15000 });

    // Verify which state we're in
    const hasHeading = await heading.isVisible({ timeout: 2000 }).catch(() => false);
    const hasError = await errorBox.isVisible({ timeout: 2000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    // If heading is visible, verify filters are present
    if (hasHeading) {
      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();
      expect(count).toBeGreaterThanOrEqual(2); // Should have start and end date inputs
      
      // Verify filters section is visible
      const filtersSection = page.locator('text=/Start Date/i').or(page.locator('text=/End Date/i'));
      await expect(filtersSection.first()).toBeVisible({ timeout: 5000 });
    }
    
    // If error, verify error message is visible
    if (hasError) {
      await expect(errorText).toBeVisible({ timeout: 2000 });
    }
    
    // If empty state, verify message is visible
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible({ timeout: 2000 });
    }
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
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1000); // Wait for React to re-render
    }

    // Check for error message - should be in red box
    const errorBox = page.locator('.bg-red-50').first();
    const errorText = page.locator('.text-red-800').first();
    
    // Error box should be visible
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    
    // Error text should contain error message
    await expect(errorText).toBeVisible({ timeout: 5000 });
    
    // Verify error text contains error-related words
    const errorContent = await errorText.textContent();
    expect(errorContent).toMatch(/error|failed/i);
  });

  test("should render Cancellation Analytics page (admin access required)", async ({
    page,
  }) => {
    test.setTimeout(30000);

    // Navigate to cancellation analytics page
    await page.goto("/app/admin/cancellation-analytics", { waitUntil: "domcontentloaded" });
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    
    // Check for loading state first
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      // Wait for loading to complete
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000); // Additional wait after loading
    }

    // After loading, check for expected states:
    // 1. Access denied message (expected for non-admin users)
    // 2. Analytics content (if admin - unlikely for test user)
    const accessDeniedText = page.locator('text=/access denied/i').or(page.locator('text=/forbidden/i'));
    const accessDeniedBox = page.locator('.bg-red-50').first();
    const goBackButton = page.locator('button:has-text("Go back")');
    const analyticsHeading = page.locator('h1:has-text("Cancellation Feedback Analytics")');

    // Wait for one of these to be visible
    const anyContent = accessDeniedText.or(accessDeniedBox).or(goBackButton).or(analyticsHeading);
    await expect(anyContent.first()).toBeVisible({ timeout: 15000 });

    // Check what's visible
    const hasAccessDeniedText = await accessDeniedText.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAccessDeniedBox = await accessDeniedBox.isVisible({ timeout: 3000 }).catch(() => false);
    const hasGoBack = await goBackButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAnalyticsHeading = await analyticsHeading.isVisible({ timeout: 3000 }).catch(() => false);

    // For non-admin users, we expect access denied (text or box) OR go back button
    // For admin users, we'd see the heading
    const hasAccessDenied = hasAccessDeniedText || hasAccessDeniedBox || hasGoBack;

    // One of these should be visible
    expect(hasAccessDenied || hasAnalyticsHeading).toBe(true);

    // If access denied, that's expected for non-admin users - test passes
    if (hasAccessDenied) {
      // Verify "Go back" button works if present
      if (hasGoBack) {
        await goBackButton.click();
        await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
      }
      return;
    }

    // If admin access (unlikely for test user), check for key elements
    if (hasAnalyticsHeading) {
      // Check for filters
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });

      // Check for export button or breakdown section
      const exportButton = page.locator('button:has-text("Export CSV")');
      const breakdownSection = page.locator('text=/breakdown/i').or(page.locator('text=/total/i'));

      // At least one should be present
      await expect(exportButton.or(breakdownSection).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should apply date filters on Analytics page", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // CRITICAL: Verify we're on analytics page
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    // Wait for loading to complete
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1000);
    }

    // Verify heading is visible (page loaded)
    const heading = page.locator('h1:has-text("Analytics")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Find date inputs - they should exist if page loaded successfully
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    
    // Fail test if date inputs don't exist (page might be in error state)
    expect(count).toBeGreaterThanOrEqual(2); // Should have start and end date inputs

    // Set start date
    const startDate = dateInputs.first();
    await startDate.fill("2025-01-01");

    // Set end date
    const endDate = dateInputs.nth(1);
    await endDate.fill("2025-01-31");

    // Wait for filters to apply (API call should be triggered by useEffect)
    await page.waitForTimeout(2000);

    // Verify dates are set
    await expect(startDate).toHaveValue("2025-01-01");
    await expect(endDate).toHaveValue("2025-01-31");
  });
});
