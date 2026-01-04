import { test, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";
import { createTestUserWithOnboardingCompleted } from "../helpers/create-user";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * Diagnostic test to understand what's actually happening on the analytics page
 * This test will capture API responses, console errors, and actual DOM content
 */
test.describe("Analytics Page Diagnostic", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    testUser = await createTestUserWithOnboardingCompleted();
    await signInUser(page, testUser.email, testUser.password);
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/app/, { timeout: 10000 });
  });

  test.afterEach(async () => {
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test("diagnostic: capture what analytics page actually renders", async ({ page }) => {
    test.setTimeout(60000);

    // Capture all API responses
    const apiResponses: Array<{ url: string; status: number; body: unknown }> = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/analytics')) {
        try {
          const body = await response.json().catch(() => null);
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            body: body,
          });
        } catch (e) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            body: `Failed to parse: ${e}`,
          });
        }
      }
    });

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to analytics page
    await page.goto("/app/analytics", { waitUntil: "domcontentloaded" });
    
    // Wait for page to stabilize
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);

    // Get actual page content
    const pageUrl = page.url();
    const pageTitle = await page.title();
    const bodyHTML = await page.locator('body').innerHTML().catch(() => '');
    const bodyText = await page.locator('body').textContent().catch(() => '');
    
    // Get all visible elements
    const visibleElements = await page.evaluate(() => {
      const elements: Array<{ tag: string; text: string; classes: string }> = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const htmlEl = el as HTMLElement;
        if (style.display !== 'none' && style.visibility !== 'hidden' && htmlEl.offsetParent !== null) {
          const text = el.textContent?.trim();
          if (text && text.length > 0 && text.length < 200) {
            elements.push({
              tag: el.tagName,
              text: text,
              classes: el.className || '',
            });
          }
        }
      });
      return elements.slice(0, 50);
    });

    // Log everything
    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log('Page URL:', pageUrl);
    console.log('Page Title:', pageTitle);
    console.log('Body text length:', bodyText?.length || 0);
    console.log('Body text (first 2000 chars):', bodyText?.substring(0, 2000));
    console.log('API Responses:', JSON.stringify(apiResponses, null, 2));
    console.log('Console Errors:', consoleErrors);
    console.log('Visible Elements (first 50):', JSON.stringify(visibleElements, null, 2));
    
    // Check if page has React root
    const hasReactRoot = await page.evaluate(() => {
      return !!document.querySelector('#__next') || !!document.querySelector('[data-reactroot]');
    });
    console.log('Has React root:', hasReactRoot);

    // Check for loading state
    const loadingText = page.locator('text="Loading analytics..."');
    const isLoading = await loadingText.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Is loading:', isLoading);

    // Check for error state
    const errorBox = page.locator('.bg-red-50').first();
    const hasError = await errorBox.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Has error:', hasError);
    if (hasError) {
      const errorText = await page.locator('.text-red-800').first().textContent().catch(() => '');
      console.log('Error message:', errorText);
    }

    // Check for heading
    const heading = page.locator('h1:has-text("Analytics")');
    const hasHeading = await heading.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Has heading:', hasHeading);

    // Take screenshot
    await page.screenshot({ path: 'test-results/diagnostic-analytics-page.png', fullPage: true });

    // This test doesn't fail - it just collects diagnostic info
    // The output will show us what's actually happening
  });
});

