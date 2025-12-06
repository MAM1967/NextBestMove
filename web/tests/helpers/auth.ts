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
  
  // Submit form
  const submitButton = page.locator('button[type="submit"]:has-text("Sign in"), button:has-text("Signing in")');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });
  
  // Click and wait for navigation (could go to /app or /onboarding)
  await Promise.all([
    page.waitForURL(/\/app|\/onboarding/, { timeout: 30000 }),
    submitButton.click(),
  ]);
  
  // Wait for page to load
  await page.waitForLoadState("networkidle");
  
  // Verify we're on the right page
  const currentUrl = page.url();
  if (!currentUrl.includes("/app") && !currentUrl.includes("/onboarding")) {
    throw new Error(`Unexpected URL after sign-in: ${currentUrl}. Expected /app or /onboarding`);
  }
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

