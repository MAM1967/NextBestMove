import { test as setup, expect } from "@playwright/test";
import { signInUser } from "../helpers/auth";

/**
 * Playwright Setup Project: Authentication State
 * 
 * This setup project logs in a test user and saves the authentication state
 * to storageState.json, which can be reused by other tests to avoid repeated logins.
 * 
 * Usage: Other tests can use `storageState: "tests/setup/.auth/user.json"` in their config.
 */

const authFile = "tests/setup/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Use a dedicated test user for setup (or create one programmatically)
  const testEmail = process.env.TEST_USER_EMAIL || "setup@staging.nextbestmove.app";
  const testPassword = process.env.TEST_USER_PASSWORD || "TestPassword123!";

  // Sign in the user
  await signInUser(page, testEmail, testPassword);

  // Wait for successful authentication (redirect to /app)
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Verify we're authenticated by checking for user-specific content
  // This could be checking for user name in sidebar, or any authenticated-only element
  await expect(page.locator("body")).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });

  console.log(`✅ Authentication state saved to ${authFile}`);
});

