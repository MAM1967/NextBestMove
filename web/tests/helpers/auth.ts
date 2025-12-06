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
 * Based on best practices for Playwright + React Server Actions
 */
export async function signInUser(page: Page, email: string, password: string) {
  // Navigate to sign in page
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for the form to be visible and ready
  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  
  // Fill sign in form
  await emailInput.fill(email);
  
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  await passwordInput.fill(password);
  
  // Submit form - wait for both network response AND navigation
  // React Server Actions make network requests, so we should wait for the response
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });
  
  // Strategy 1: Wait for network response from the server action
  // React Server Actions typically make POST requests to the same route
  const responsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      // Wait for the server action response (Next.js server actions use POST to the same route)
      return (
        response.request().method() === "POST" &&
        (url.includes("/auth/sign-in") || url.includes("/api/auth") || url.includes("signInAction"))
      ) && response.status() < 400;
    },
    { timeout: 30000 }
  );
  
  // Strategy 2: Wait for button state change (indicates form is submitting)
  const buttonStatePromise = submitButton.waitFor({ 
    state: "visible",
    timeout: 5000 
  }).then(() => {
    // Wait for button text to change to "Signing in..." or button to be disabled
    return Promise.race([
      page.waitForSelector('button:has-text("Signing in")', { timeout: 2000 }).catch(() => null),
      submitButton.waitFor({ state: "hidden" }).catch(() => null),
    ]);
  });
  
  // Strategy 3: Wait for navigation OR specific elements that appear after sign-in
  const navigationPromise = Promise.race([
    page.waitForURL(/\/app|\/onboarding/, { timeout: 30000 }),
    // Also wait for elements that appear after successful sign-in
    page.waitForSelector('h1, [data-testid], nav, main', { timeout: 30000 }).then(() => {
      // Check if we're on a different page
      const url = page.url();
      if (url.includes("/app") || url.includes("/onboarding")) {
        return url;
      }
      throw new Error("Still on sign-in page");
    }),
  ]);
  
  // Click submit button
  await submitButton.click();
  
  // Wait for the response first (confirms server action completed)
  try {
    await responsePromise;
    console.log("✅ Server action response received");
  } catch (error) {
    console.warn("⚠️  No server action response detected, continuing...");
  }
  
  // Wait for navigation or UI change
  try {
    await navigationPromise;
    
    // Wait for page to stabilize
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // If networkidle times out, that's okay - just continue
      console.log("⚠️  Network idle timeout, continuing...");
    });
    
    // Verify we're on the right page
    const currentUrl = page.url();
    if (!currentUrl.includes("/app") && !currentUrl.includes("/onboarding")) {
      // Check for error messages
      const errorMessage = page.locator('[class*="error"], [class*="red"], .text-red-800, .text-red-600');
      const errorVisible = await errorMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (errorVisible) {
        const errorText = await errorMessage.first().textContent() || "";
        throw new Error(`Sign-in failed: ${errorText}. Current URL: ${currentUrl}`);
      }
      
      throw new Error(`Unexpected URL after sign-in: ${currentUrl}. Expected /app or /onboarding`);
    }
    
    console.log(`✅ Successfully navigated to: ${currentUrl}`);
  } catch (error) {
    // Check for error messages if navigation failed
    const errorMessage = page.locator('[class*="error"], [class*="red"], .text-red-800, .text-red-600');
    const errorVisible = await errorMessage.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorMessage.first().textContent() || "";
      const currentUrl = page.url();
      throw new Error(`Sign-in failed: ${errorText}. Current URL: ${currentUrl}`);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: "test-results/sign-in-failed.png" }).catch(() => {});
    
    // Re-throw original error
    throw error;
  }
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

