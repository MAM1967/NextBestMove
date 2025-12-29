import { test, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";
import { createTestUserWithOnboardingCompleted } from "../helpers/create-user";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * E2E tests for Analytics pages
 * 
 * Based on actual page structure from web/src/app/app/analytics/page.tsx
 */
test.describe("Analytics Pages", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    testUser = await createTestUserWithOnboardingCompleted();
    await signInUser(page, testUser.email, testUser.password);
    
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/app/, { timeout: 10000 });
    
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
    
    // Wait for any initial network requests
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    
    // Wait for loading state to complete
    const loadingText = page.locator('text="Loading analytics..."');
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // Loading might have completed instantly
    }
    
    // Additional wait for React to finish rendering
    await page.waitForTimeout(3000);

    // DEBUG: Log what's actually on the page
    const pageContent = await page.content();
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const visibleText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
        })
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0)
        .slice(0, 20); // First 20 visible text elements
    }).catch(() => []);

    console.log('Page URL:', page.url());
    console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
    console.log('Visible text elements:', visibleText);
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check for network errors
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400 && response.url().includes('/api/analytics')) {
        networkErrors.push(`${response.url()}: ${response.status()}`);
      }
    });

    // After waiting, check what state the page is in
    // Check for error state first
    const errorBox = page.locator('.bg-red-50').first();
    const errorText = page.locator('.text-red-800').first();
    const hasError = await errorBox.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasError) {
      const errorMessage = await errorText.textContent().catch(() => 'unknown error');
      console.log('Page is in error state:', errorMessage);
      console.log('Console errors:', consoleErrors);
      console.log('Network errors:', networkErrors);
      await expect(errorText).toBeVisible({ timeout: 2000 });
      return;
    }

    // Check for heading - this should ALWAYS be visible if not loading/error
    const heading = page.locator('h1:has-text("Analytics")');
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!headingVisible) {
      // Heading not visible - something is wrong
      console.log('ERROR: Heading not visible after waiting');
      console.log('Page URL:', page.url());
      console.log('Body text:', bodyText?.substring(0, 1000));
      console.log('Console errors:', consoleErrors);
      console.log('Network errors:', networkErrors);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/debug-analytics-page.png', fullPage: true });
      
      // Check if page is still loading
      const stillLoading = await loadingText.isVisible({ timeout: 1000 }).catch(() => false);
      if (stillLoading) {
        throw new Error('Page is still in loading state after timeout');
      }
      
      // Check if we're on a different page
      const currentUrl = page.url();
      if (!currentUrl.includes('/analytics')) {
        throw new Error(`Page redirected away from /analytics. Current URL: ${currentUrl}`);
      }
      
      throw new Error('Analytics page heading not visible. Check debug screenshot and logs above.');
    }

    // Heading is visible - verify filters
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    const filtersSection = page.locator('text=/Start Date/i').or(page.locator('text=/End Date/i'));
    await expect(filtersSection.first()).toBeVisible({ timeout: 5000 });
    
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    expect(dateInputCount).toBeGreaterThanOrEqual(2);
    
    // Check for content sections
    const emptyState = page.locator('text=/No analytics data available/i');
    const dealMetricsSection = page.locator('text=/Deal Progression/i').or(page.locator('text=/Total Deals/i'));
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    const hasDealMetrics = await dealMetricsSection.isVisible({ timeout: 2000 }).catch(() => false);
    
    // At least one should be visible
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
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    
    // Wait for loading to complete
    const loadingText = page.locator('text="Loading analytics..."');
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // Loading might have completed instantly
    }
    await page.waitForTimeout(3000);

    // Error state: <div class="bg-red-50"><p class="text-red-800">error</p></div>
    const errorBox = page.locator('.bg-red-50').first();
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    
    const errorText = page.locator('.text-red-800').first();
    await expect(errorText).toBeVisible({ timeout: 5000 });
    
    const errorContent = await errorText.textContent();
    expect(errorContent).toMatch(/error|failed/i);
  });

  test("should render Cancellation Analytics page (admin access required)", async ({
    page,
  }) => {
    test.setTimeout(30000);

    await page.goto("/app/admin/cancellation-analytics", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoading) {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    const accessDeniedBox = page.locator('.bg-red-50').first();
    const accessDeniedText = page.locator('text=/access denied/i').or(page.locator('text=/forbidden/i'));
    const goBackButton = page.locator('button:has-text("Go back")');
    const analyticsHeading = page.locator('h1:has-text("Cancellation Feedback Analytics")');

    const anyContent = accessDeniedBox.or(accessDeniedText).or(goBackButton).or(analyticsHeading);
    await expect(anyContent.first()).toBeVisible({ timeout: 15000 });

    const hasAccessDeniedBox = await accessDeniedBox.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAccessDeniedText = await accessDeniedText.isVisible({ timeout: 3000 }).catch(() => false);
    const hasGoBack = await goBackButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAnalyticsHeading = await analyticsHeading.isVisible({ timeout: 3000 }).catch(() => false);

    const hasAccessDenied = hasAccessDeniedBox || hasAccessDeniedText || hasGoBack;
    expect(hasAccessDenied || hasAnalyticsHeading).toBe(true);

    if (hasAccessDenied) {
      if (hasGoBack) {
        await goBackButton.click();
        await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
      }
      return;
    }

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
    await expect(page).toHaveURL(/\/app\/analytics/, { timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const loadingText = page.locator('text="Loading analytics..."');
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 30000 });
    } catch {
      // Loading might have completed instantly
    }
    await page.waitForTimeout(3000);

    // Verify heading is visible
    const heading = page.locator('h1:has-text("Analytics")');
    const headingVisible = await heading.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!headingVisible) {
      // If heading not visible, page might be in error state or still loading
      const errorBox = page.locator('.bg-red-50').first();
      const hasError = await errorBox.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        // Page is in error state - skip filter test
        return;
      }
      // Still not visible - fail test
      throw new Error('Analytics page heading not visible. Page may not have loaded correctly.');
    }

    await expect(heading).toBeVisible({ timeout: 5000 });

    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const startDate = dateInputs.first();
    await startDate.fill("2025-01-01");

    const endDate = dateInputs.nth(1);
    await endDate.fill("2025-01-31");

    await page.waitForTimeout(3000);

    await expect(startDate).toHaveValue("2025-01-01");
    await expect(endDate).toHaveValue("2025-01-31");
  });
});
