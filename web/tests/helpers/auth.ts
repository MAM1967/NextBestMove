import { Page } from "@playwright/test";
import { STAGING_CONFIG, generateTestUser } from "./staging-config";

/**
 * Sign up a new user via the UI
 */
export async function signUpUser(page: Page, email?: string, password?: string, name?: string) {
  const testUser = email && password && name 
    ? { email, password, name }
    : generateTestUser();

  // Navigate to sign up page
  const response = await page.goto("/auth/sign-up", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Check if Basic Auth failed (401 status)
  if (response && response.status() === 401) {
    throw new Error("Basic Auth failed - check STAGING_USER and STAGING_PASS environment variables");
  }
  
  // Wait for page to be fully loaded and form to be visible
  // Check if we're actually on the sign-up page (not blocked by Basic Auth)
  const currentUrl = page.url();
  if (!currentUrl.includes("/auth/sign-up") && !currentUrl.includes("/app")) {
    throw new Error(`Unexpected URL after navigation: ${currentUrl}. Expected /auth/sign-up or /app`);
  }
  
  // Wait for the form to be visible (with multiple selector options)
  // Try to find any form element first to ensure page loaded
  await page.waitForSelector('form, input[type="text"], input[type="email"]', { timeout: 10000 });
  
  const nameInput = page.locator('input#name, input[name="name"], input[type="text"][autocomplete="name"]');
  await nameInput.waitFor({ state: "visible", timeout: 10000 });
  
  // Fill sign up form using id or name selectors
  await nameInput.fill(testUser.name);
  
  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 5000 });
  await emailInput.fill(testUser.email);
  
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  await passwordInput.fill(testUser.password);
  
  // Submit form - wait for button to be enabled
  const submitButton = page.locator('button[type="submit"]:has-text("Create account"), button:has-text("Creating account")');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });
  
  // Click submit button
  await submitButton.click();
  
  // Wait for either navigation OR error message to appear
  // The form uses server actions, so we need to wait for the response
  try {
    // Wait for navigation to app or onboarding (success case)
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20000 });
    
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    
    // Check if we're on onboarding or app
    const finalUrl = page.url();
    if (finalUrl.includes("/onboarding")) {
      // User is on onboarding - that's fine, they're authenticated
      console.log("✅ User redirected to onboarding after sign-up");
    } else if (finalUrl.includes("/app")) {
      console.log("✅ User redirected to app after sign-up");
    } else {
      throw new Error(`Unexpected URL after sign-up: ${finalUrl}. Expected /app or /onboarding`);
    }
  } catch (error) {
    // If navigation didn't happen, check for error messages
    const errorMessage = page.locator('[class*="error"], [class*="red"], .text-red-800, .text-red-600');
    const errorVisible = await errorMessage.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorMessage.first().textContent();
      const currentUrl = page.url();
      throw new Error(`Sign-up failed on ${currentUrl}: ${errorText || "Unknown error"}`);
    }
    
    // Check if we're still on sign-up page (form submission failed)
    const currentUrl = page.url();
    if (currentUrl.includes("/auth/sign-up")) {
      // Take a screenshot for debugging
      await page.screenshot({ path: "test-results/sign-up-failed.png" });
      throw new Error(`Sign-up form submission failed - still on ${currentUrl}. Check screenshot: test-results/sign-up-failed.png`);
    }
    
    // Re-throw the original error if it wasn't a navigation timeout
    throw error;
  }
  
  return testUser;
}

/**
 * Sign in an existing user via the UI
 */
export async function signInUser(page: Page, email: string, password: string) {
  // Navigate to sign in page
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  
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
  await submitButton.click();
  
  // Wait for redirect to app
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

