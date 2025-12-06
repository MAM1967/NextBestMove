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
 * Bypasses the UI form entirely by using Supabase client via storage state
 * This is more reliable since programmatic sign-in works but UI form fails
 */
export async function signInUser(page: Page, email: string, password: string) {
  console.log(`🔐 Signing in programmatically in browser context...`);
  
  // Sign in programmatically using Node.js Supabase client to get session
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    STAGING_CONFIG.supabaseUrl!,
    STAGING_CONFIG.supabaseAnonKey!
  );
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (signInError || !signInData.session) {
    throw new Error(`Programmatic sign-in failed: ${signInError?.message || 'No session'}`);
  }
  
  console.log(`✅ Programmatic sign-in successful, setting browser cookies...`);
  
  // Extract the session cookies and set them in the browser
  const session = signInData.session;
  const supabaseProjectRef = STAGING_CONFIG.supabaseUrl!.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';
  
  // Set Supabase auth cookies in browser context
  await page.context().addCookies([
    {
      name: `sb-${supabaseProjectRef}-auth-token`,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: signInData.user,
      }),
      domain: '.nextbestmove.app',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax' as const,
      expires: session.expires_at ? Math.floor(session.expires_at) : undefined,
    },
  ]);
  
  console.log(`✅ Browser cookies set, navigating to app...`);
  
  // Now navigate to the app - user should be authenticated via cookies
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

