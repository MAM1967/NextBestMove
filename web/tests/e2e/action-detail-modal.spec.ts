import { test, expect } from "@playwright/test";

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
  test.beforeEach(async ({ page }) => {
    // Navigate to actions page
    // This assumes user is already authenticated (via auth.setup.ts)
    await page.goto("/app/actions");
  });

  test("should open modal when action row is clicked", async ({ page }) => {
    // Wait for actions to load
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });

    // Click first action row
    const firstAction = page.locator('[data-testid="action-row"]').first();
    await firstAction.click();

    // Verify modal is visible
    await expect(page.locator('[data-testid="action-detail-modal"]')).toBeVisible();
  });

  test("should display action details in modal", async ({ page }) => {
    // Open modal
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });
    await page.locator('[data-testid="action-row"]').first().click();

    // Verify action details are displayed
    await expect(page.locator('[data-testid="action-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-state"]')).toBeVisible();
  });

  test("should display action history timeline", async ({ page }) => {
    // Open modal
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });
    await page.locator('[data-testid="action-row"]').first().click();

    // Verify history section is visible
    await expect(page.locator('[data-testid="action-history"]')).toBeVisible();
  });

  test("should display related actions", async ({ page }) => {
    // Open modal for an action with a lead
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });
    await page.locator('[data-testid="action-row"]').first().click();

    // Verify related actions section (may be empty if no related actions)
    const relatedActions = page.locator('[data-testid="related-actions"]');
    // Section should exist, but may be empty
    await expect(relatedActions.or(page.locator('text=No related actions'))).toBeVisible();
  });

  test("should close modal when close button is clicked", async ({ page }) => {
    // Open modal
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });
    await page.locator('[data-testid="action-row"]').first().click();

    // Click close button
    await page.locator('[data-testid="modal-close"]').click();

    // Verify modal is hidden
    await expect(page.locator('[data-testid="action-detail-modal"]')).not.toBeVisible();
  });

  test("should close modal when clicking outside", async ({ page }) => {
    // Open modal
    await page.waitForSelector('[data-testid="action-row"]', { timeout: 10000 });
    await page.locator('[data-testid="action-row"]').first().click();

    // Click outside modal (on backdrop)
    await page.locator('[data-testid="modal-backdrop"]').click({ position: { x: 0, y: 0 } });

    // Verify modal is hidden
    await expect(page.locator('[data-testid="action-detail-modal"]')).not.toBeVisible();
  });
});

