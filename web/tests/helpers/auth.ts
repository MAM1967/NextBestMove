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
  // Clear any existing values first to avoid issues
  await emailInput.clear();
  await emailInput.fill(email);
  
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 5000 });
  await passwordInput.clear();
  await passwordInput.fill(password);
  
  // Verify values were filled correctly
  const filledEmail = await emailInput.inputValue();
  const filledPassword = await passwordInput.inputValue();
  console.log(`📝 Form filled - Email: ${filledEmail.substring(0, 10)}... (length: ${filledEmail.length}), Password length: ${filledPassword.length}`);
  
  if (filledEmail !== email) {
    throw new Error(`Email mismatch: expected "${email}", got "${filledEmail}"`);
  }
  if (filledPassword.length !== password.length) {
    throw new Error(`Password length mismatch: expected ${password.length}, got ${filledPassword.length}`);
  }
  
  // Submit form - wait for both network response AND navigation
  // React Server Actions make network requests, so we should wait for the response
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });
  
  // Check if form is valid before submitting
  const form = page.locator('form');
  const isFormValid = await form.evaluate((form) => {
    return (form as HTMLFormElement).checkValidity();
  });
  
  if (!isFormValid) {
    throw new Error("Form validation failed - check if email and password are filled correctly");
  }
  
  // Strategy 1: Wait for network response from the server action
  // React Server Actions use POST requests - monitor all POST requests
  const responsePromise = page.waitForResponse(
    (response) => {
      const method = response.request().method();
      const url = response.url();
      // Next.js server actions make POST requests - look for any POST to the current route
      return method === "POST" && response.status() < 500;
    },
    { timeout: 10000 }
  ).catch(() => {
    console.warn("⚠️  No POST response detected within 10s");
    return null;
  });
  
  // Strategy 2: Wait for button state change (indicates form is submitting)
  // The button should change to "Signing in..." when submitting
  const buttonTextPromise = page.waitForFunction(
    () => {
      const button = document.querySelector('button[type="submit"]');
      return button?.textContent?.includes("Signing in") || false;
    },
    { timeout: 5000 }
  ).catch(() => {
    console.warn("⚠️  Button text didn't change to 'Signing in'");
    return null;
  });
  
  // Strategy 3: Wait for navigation OR error message
  const navigationPromise = page.waitForURL(/\/app|\/onboarding/, { timeout: 30000 });
  const errorMessagePromise = page.waitForSelector(
    '[class*="error"], [class*="red"], .text-red-800, .text-red-600',
    { timeout: 5000 }
  ).catch(() => null);
  
  // Click submit button
  console.log("🖱️  Clicking submit button...");
  await submitButton.click();
  
  // Wait for button to show "Signing in..." state
  try {
    await buttonTextPromise;
    console.log("✅ Button state changed to 'Signing in'");
  } catch (error) {
    console.warn("⚠️  Button state didn't change");
  }
  
  // Wait for either navigation OR error message
  const result = await Promise.race([
    navigationPromise.then(() => ({ type: "navigation" as const })),
    errorMessagePromise.then((errorEl) => ({ type: "error" as const, element: errorEl })),
  ]);
  
  if (result.type === "error") {
    // Error message appeared - get the text
    const errorText = await page.locator('[class*="error"], [class*="red"], .text-red-800, .text-red-600').first().textContent() || "Unknown error";
    const currentUrl = page.url();
    await page.screenshot({ path: "test-results/sign-in-error.png" });
    throw new Error(`Sign-in failed with error: ${errorText}. Current URL: ${currentUrl}`);
  }
  
  // Navigation succeeded - wait for page to stabilize
  try {
    await responsePromise;
    console.log("✅ Server action response received");
  } catch (error) {
    console.warn("⚠️  No server action response detected, but navigation occurred");
  }
  
  // Wait for page to stabilize
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch (error) {
    console.warn("⚠️  Network idle timeout, continuing...");
  }
  
  // Verify we're on the right page
  const currentUrl = page.url();
  if (!currentUrl.includes("/app") && !currentUrl.includes("/onboarding")) {
    await page.screenshot({ path: "test-results/sign-in-unexpected-url.png" });
    throw new Error(`Unexpected URL after sign-in: ${currentUrl}. Expected /app or /onboarding`);
  }
  
  console.log(`✅ Successfully navigated to: ${currentUrl}`);
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

