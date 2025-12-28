import { test, expect } from "@playwright/test";

/**
 * E2E tests for Pricing Page (NEX-27)
 * 
 * These tests verify:
 * - Pricing page loads correctly
 * - All three tiers are displayed
 * - Feature comparison matrix is visible
 * - Billing interval toggle works
 * - Annual savings are displayed
 * - Upgrade CTAs work correctly
 * - Mobile responsive layout
 */
test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("should display pricing page with all tiers", async ({ page }) => {
    // Check page title/heading
    await expect(page.getByRole("heading", { name: /Simple, transparent pricing/i })).toBeVisible();

    // Check all three tiers are present
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Standard")).toBeVisible();
    await expect(page.getByText("Premium")).toBeVisible();

    // Check tier taglines
    await expect(page.getByText("Memory Relief")).toBeVisible();
    await expect(page.getByText("Decision Automation")).toBeVisible();
    await expect(page.getByText("Intelligence & Leverage")).toBeVisible();
  });

  test("should display pricing for monthly billing", async ({ page }) => {
    // Default should be monthly
    await expect(page.getByText("$29")).toBeVisible();
    await expect(page.getByText("/month")).toBeVisible();
    await expect(page.getByText("$79")).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
  });

  test("should toggle to yearly billing and show savings", async ({ page }) => {
    // Toggle to yearly
    const toggle = page.locator('button:has-text("Yearly")').first();
    await toggle.click();

    // Wait for prices to update
    await expect(page.getByText("$249")).toBeVisible();
    await expect(page.getByText("/year")).toBeVisible();
    await expect(page.getByText("$649")).toBeVisible();

    // Check savings are displayed
    await expect(page.getByText(/Save \$99\/year/i)).toBeVisible();
    await expect(page.getByText(/Save \$299\/year/i)).toBeVisible();
  });

  test("should display feature comparison matrix", async ({ page }) => {
    // Check feature comparison section
    await expect(page.getByRole("heading", { name: /Feature Comparison/i })).toBeVisible();

    // Check some key features are present
    await expect(page.getByText("Active relationships")).toBeVisible();
    await expect(page.getByText("Automatic daily plan")).toBeVisible();
    await expect(page.getByText("Pre-call notes")).toBeVisible();
    await expect(page.getByText("Pattern views & trends")).toBeVisible();
  });

  test("should show Standard as recommended", async ({ page }) => {
    await expect(page.getByText("Most Popular")).toBeVisible();
    await expect(page.getByText("(Recommended)")).toBeVisible();
  });

  test("should have upgrade CTAs for paid tiers", async ({ page }) => {
    // Standard tier should have "Start 14-day trial" button
    const standardButton = page.locator('button:has-text("Start 14-day trial")').first();
    await expect(standardButton).toBeVisible();

    // Premium tier should have "Start 14-day trial" button
    const premiumButton = page.locator('button:has-text("Start 14-day trial")').last();
    await expect(premiumButton).toBeVisible();

    // Free tier should have "Get started" link
    const freeButton = page.locator('a:has-text("Get started")').first();
    await expect(freeButton).toBeVisible();
  });

  test("should display trial messaging", async ({ page }) => {
    await expect(page.getByText(/14-day Standard trial/i)).toBeVisible();
    await expect(page.getByText(/No credit card required/i)).toBeVisible();
  });

  test("should be mobile responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that pricing cards are still visible
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Standard")).toBeVisible();
    await expect(page.getByText("Premium")).toBeVisible();

    // Check feature comparison is still accessible
    await expect(page.getByRole("heading", { name: /Feature Comparison/i })).toBeVisible();
  });

  test("should navigate to sign-up from Free tier", async ({ page }) => {
    const freeButton = page.locator('a:has-text("Get started")').first();
    await expect(freeButton).toHaveAttribute("href", "/auth/sign-up");
  });

  test("should show correct feature values in matrix", async ({ page }) => {
    // Check Free tier has limited features
    const freeSection = page.locator('text=Free').first();
    await expect(freeSection).toBeVisible();

    // Check Standard tier has enhanced features
    await expect(page.getByText("20", { exact: false })).toBeVisible(); // Active relationships for Standard

    // Check Premium tier has unlimited
    await expect(page.getByText("Unlimited")).toBeVisible();
  });

  test("should display FAQ section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Questions about pricing/i })).toBeVisible();
    await expect(page.getByText(/14-day trial/i)).toBeVisible();
    await expect(page.getByText(/Annual savings/i)).toBeVisible();
    await expect(page.getByText(/Upgrade anytime/i)).toBeVisible();
  });
});

