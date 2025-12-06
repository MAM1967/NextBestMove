import { Page } from "@playwright/test";
import { STAGING_CONFIG, generateTestUser } from "./staging-config";
import { confirmUserEmail } from "./test-data";
import { createTestUserProgrammatically } from "./create-user";

/**
 * Sign up a new user (creates pre-seeded user programmatically)
 * Creates user with email confirmed but onboarding NOT completed
 * This way tests just need to sign in and go through onboarding
 * Much faster and more reliable than UI sign-up flow
 */
export async function signUpUser(page: Page, email?: string, password?: string, name?: string) {
  // Use programmatic creation (more reliable for tests)
  // Creates user with email confirmed but onboarding NOT completed
  // This way tests just need to sign in and go through onboarding
  console.log("🔧 Creating pre-seeded test user (email confirmed, onboarding pending)...");
  const programmaticUser = await createTestUserProgrammatically();
  console.log("✅ Pre-seeded user created, signing in...");
  
  // Sign in with the programmatically created user
  // User will be redirected to /onboarding since onboarding_completed = false
  await signInUser(page, programmaticUser.email, programmaticUser.password);
  console.log("✅ Sign-in successful - user ready for onboarding flow");
  return programmaticUser;
}

/**
 * Sign in an existing user via the UI
 * Handles React Server Actions with client-side navigation
 */
export async function signInUser(page: Page, email: string, password: string) {
  // Navigate to sign in page
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for the form to be visible
  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  
  // Fill sign in form using id or name selectors
  await emailInput.fill(email);
  
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  await passwordInput.fill(password);
  
  // Submit form - click submit button and wait for navigation
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });
  
  // Wait for navigation (could go to /app or /onboarding)
  // The form uses React Server Actions with client-side navigation via router.push()
  // We need to wait for the URL to change, which happens after the server action completes
  const navigationPromise = page.waitForURL(/\/app|\/onboarding/, { timeout: 30000 });
  
  // Click submit button
  await submitButton.click();
  
  // Wait for either navigation OR error message
  try {
    await navigationPromise;
    
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
    
    // Verify we're on the right page
    const currentUrl = page.url();
    if (!currentUrl.includes("/app") && !currentUrl.includes("/onboarding")) {
      throw new Error(`Unexpected URL after sign-in: ${currentUrl}. Expected /app or /onboarding`);
    }
  } catch (error) {
    // Check for error messages if navigation failed
    const errorMessage = page.locator('[class*="error"], [class*="red"], .text-red-800, .text-red-600');
    const errorVisible = await errorMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorMessage.first().textContent() || "";
      const currentUrl = page.url();
      throw new Error(`Sign-in failed: ${errorText}. Current URL: ${currentUrl}`);
    }
    
    // Re-throw original error if no error message found
    throw error;
  }
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

