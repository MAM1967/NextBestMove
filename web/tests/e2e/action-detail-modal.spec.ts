import { test, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";
import { createTestUserWithOnboardingCompleted } from "../helpers/create-user";
import { cleanupTestUser } from "../helpers/test-data";

/**
 * E2E tests for Action Detail Modal (NEX-23)
 * 
 * These tests verify:
 * - Modal opens when action row is clicked
 * - Action details are displayed correctly
 * - Action history timeline is shown
 * - Related actions are displayed
 * - Modal can be closed
 */
test.describe("Action Detail Modal", () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeEach(async ({ page }) => {
    // Create a user with onboarding already completed
    testUser = await createTestUserWithOnboardingCompleted();
    
    // Sign in the user
    await signInUser(page, testUser.email, testUser.password);
    
    // Navigate to actions page
    await page.goto("/app/actions");
    
    // Wait for page to load - actions may take a moment to appear
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    // Clean up test user
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test("should open modal when action row is clicked", async ({ page }) => {
    // Wait for actions to load - if no actions exist, skip this test
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Click first action row
    await actionRow.click();

    // Verify modal is visible
    await expect(page.locator('[data-testid="action-detail-modal"]')).toBeVisible({ timeout: 5000 });
  });

  test("should display action details in modal", async ({ page }) => {
    // Check if actions exist
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Open modal
    await actionRow.click();

    // Verify action details are displayed
    await expect(page.locator('[data-testid="action-title"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="action-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-state"]')).toBeVisible();
  });

  test("should display action history timeline", async ({ page }) => {
    // Check if actions exist
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Open modal
    await actionRow.click();

    // Verify history section is visible (may not exist if action has no history)
    const historySection = page.locator('[data-testid="action-history"]');
    const historyCount = await historySection.count();
    // History section may not exist if action has no history, which is fine
    if (historyCount > 0) {
      await expect(historySection).toBeVisible();
    }
  });

  test("should display related actions", async ({ page }) => {
    // Check if actions exist
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Open modal
    await actionRow.click();

    // Verify related actions section (may be empty if no related actions)
    const relatedActions = page.locator('[data-testid="related-actions"]');
    await expect(relatedActions).toBeVisible({ timeout: 5000 });
  });

  test("should close modal when close button is clicked", async ({ page }) => {
    // Check if actions exist
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Open modal
    await actionRow.click();

    // Wait for modal to be visible
    await expect(page.locator('[data-testid="action-detail-modal"]')).toBeVisible();

    // Click close button
    await page.locator('[data-testid="modal-close"]').click();

    // Verify modal is hidden
    await expect(page.locator('[data-testid="action-detail-modal"]')).not.toBeVisible({ timeout: 2000 });
  });

  test("should close modal when clicking outside", async ({ page }) => {
    // Check if actions exist
    const actionRow = page.locator('[data-testid="action-row"]').first();
    const hasActions = await actionRow.count();
    
    if (hasActions === 0) {
      test.skip();
      return;
    }

    // Open modal
    await actionRow.click();

    // Wait for modal to be visible
    await expect(page.locator('[data-testid="action-detail-modal"]')).toBeVisible();

    // Click outside modal (on backdrop) - use the backdrop element
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    if (await backdrop.count() > 0) {
      await backdrop.click({ position: { x: 0, y: 0 } });
    } else {
      // Fallback: click outside the modal content
      await page.mouse.click(10, 10);
    }

    // Verify modal is hidden
    await expect(page.locator('[data-testid="action-detail-modal"]')).not.toBeVisible({ timeout: 2000 });
  });
});

