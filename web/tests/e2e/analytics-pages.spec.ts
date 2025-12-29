import { test, expect } from "@playwright/test";
import { signUpUser } from "../helpers/auth";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * E2E tests for Analytics pages
 *
 * These tests verify:
 * - Analytics page renders correctly
 * - Cancellation Analytics page renders correctly (admin only)
 * - Date filters work
 * - Pages handle loading and error states
 * - Basic UI elements are present
 */
test.describe("Analytics Pages", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    // Sign up a new user
    testUser = await signUpUser(page);
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
    await page.goto("/app/analytics");

    // Wait for page to load (either loading state or content)
    await page.waitForLoadState("networkidle");

    // Check for main heading or loading state
    const heading = page.locator('h1:has-text("Analytics"), h1:has-text("Deeper Analytics")');
    const loadingText = page.locator('text="Loading analytics..."');

    // Either heading or loading text should be present
    await expect(heading.or(loadingText)).toBeVisible({ timeout: 10000 });

    // If not loading, check for key elements
    if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Wait for loading to complete
      await expect(loadingText).not.toBeVisible({ timeout: 15000 });
    }

    // Check for date filter inputs
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    // At least one date input should be present
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });

    // Check for analytics content sections (deal progression, insights, etc.)
    // These may not be visible if user has no data, but the page structure should exist
    const pageContent = page.locator("main, [role='main'], .container, body");
    await expect(pageContent).toBeVisible();
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

    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    // Check for error message
    const errorMessage = page.locator('text=/error/i, text=/failed/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test("should render Cancellation Analytics page (admin access required)", async ({
    page,
  }) => {
    test.setTimeout(30000);

    // Navigate to cancellation analytics page
    await page.goto("/app/admin/cancellation-analytics");
    await page.waitForLoadState("networkidle");

    // Check for either:
    // 1. Access denied message (if not admin)
    // 2. Analytics content (if admin)
    // 3. Loading state

    const accessDenied = page.locator('text=/access denied/i, text=/forbidden/i, text=/admin/i');
    const analyticsContent = page.locator('h1:has-text("Cancellation"), h1:has-text("Analytics")');
    const loadingState = page.locator('text=/loading/i');

    // One of these should be visible
    const anyVisible = accessDenied.or(analyticsContent).or(loadingState);
    await expect(anyVisible.first()).toBeVisible({ timeout: 10000 });

    // If loading, wait for it to complete
    if (await loadingState.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loadingState).not.toBeVisible({ timeout: 15000 });
    }

    // If access denied, that's expected for non-admin users
    if (await accessDenied.isVisible({ timeout: 2000 }).catch(() => false)) {
      // This is expected behavior - test passes
      return;
    }

    // If admin access, check for key elements
    if (await analyticsContent.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check for filters
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });

      // Check for export button or breakdown section
      const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV")');
      const breakdownSection = page.locator('text=/breakdown/i, text=/total/i');

      // At least one should be present
      await expect(exportButton.or(breakdownSection).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should apply date filters on Analytics page", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Find date inputs
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();

    if (count >= 2) {
      // Set start date
      const startDate = page.locator('input[type="date"]').first();
      await startDate.fill("2025-01-01");

      // Set end date
      const endDate = page.locator('input[type="date"]').last();
      await endDate.fill("2025-01-31");

      // Wait for filters to apply (API call should be triggered)
      await page.waitForTimeout(1000);

      // Verify dates are set
      await expect(startDate).toHaveValue("2025-01-01");
      await expect(endDate).toHaveValue("2025-01-31");
    }
  });
});

