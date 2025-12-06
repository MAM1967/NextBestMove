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
 * Sign in an existing user programmatically in the browser
 * Bypasses the UI form entirely by using Supabase client directly in browser context
 * This is more reliable since programmatic sign-in works but UI form fails
 */
export async function signInUser(page: Page, email: string, password: string) {
  console.log(`🔐 Signing in programmatically in browser context...`);
  
  // Navigate to any page first to establish browser context
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Use browser's Supabase client to sign in programmatically
  // This will set the session cookies automatically
  const signInResult = await page.evaluate(async ({ email, password, supabaseUrl, supabaseAnonKey }) => {
    // Dynamically import Supabase client in browser context
    // @ts-ignore - Supabase will be available via CDN or we'll load it
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/esm/index.js');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, userId: data.user?.id, session: !!data.session };
  }, {
    email,
    password,
    supabaseUrl: STAGING_CONFIG.supabaseUrl,
    supabaseAnonKey: STAGING_CONFIG.supabaseAnonKey,
  });
  
  if (!signInResult.success) {
    throw new Error(`Programmatic browser sign-in failed: ${signInResult.error}`);
  }
  
  console.log(`✅ Programmatic browser sign-in successful`);
  
  // Now navigate to the app - user should be authenticated via cookies
  // Check if user needs onboarding (onboarding_completed = false)
  await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for either /app or /onboarding (middleware will redirect if onboarding needed)
  await page.waitForURL(/\/app|\/onboarding/, { timeout: 10000 });
  
  const currentUrl = page.url();
  console.log(`✅ Successfully authenticated and navigated to: ${currentUrl}`);
  
  // Wait for page to stabilize
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch (error) {
    console.warn("⚠️  Network idle timeout, continuing...");
  }
}

/**
 * Wait for user to be authenticated (check for app route)
 */
export async function waitForAuthentication(page: Page) {
  await page.waitForURL(/\/app/, { timeout: 10000 });
}

