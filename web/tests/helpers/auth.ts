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
 * Uses browser's Supabase client to sign in, which automatically sets cookies correctly
 * This is more reliable since programmatic sign-in works but UI form fails
 */
export async function signInUser(page: Page, email: string, password: string) {
  console.log(`🔐 Signing in programmatically in browser context...`);
  
  // Verify we have the required credentials
  if (!STAGING_CONFIG.supabaseUrl || !STAGING_CONFIG.supabaseAnonKey) {
    throw new Error(
      `Missing Supabase credentials for browser sign-in. ` +
      `supabaseUrl: ${STAGING_CONFIG.supabaseUrl ? 'set' : 'missing'}, ` +
      `supabaseAnonKey: ${STAGING_CONFIG.supabaseAnonKey ? 'set' : 'missing'}. ` +
      `Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in CI.`
    );
  }
  
  console.log(`🔍 Using Supabase URL: ${STAGING_CONFIG.supabaseUrl.substring(0, 50)}...`);
  console.log(`🔍 Anon key available: ${STAGING_CONFIG.supabaseAnonKey ? 'yes' : 'no'}`);
  
  // Navigate to any page first to establish browser context
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Use browser's Supabase client to sign in - this will set cookies automatically
  // We need to inject the Supabase client and sign in via browser context
  const signInResult = await page.evaluate(async ({ email, password, supabaseUrl, supabaseAnonKey }) => {
    // Load Supabase client from CDN (available globally in Next.js apps)
    // @ts-ignore - window.supabase might be available, or we use fetch
    if (typeof window !== 'undefined' && (window as any).supabase) {
      const supabase = (window as any).supabase;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, userId: data.user?.id };
    }
    
    // Fallback: Use fetch API to call Supabase auth endpoint directly
    try {
      if (!supabaseAnonKey) {
        return { success: false, error: 'Supabase anon key not provided' };
      }
      
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        return { success: false, error: error.error_description || error.message || `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      // Set cookies manually using document.cookie
      // Supabase SSR expects: sb-{project-ref}-auth-token
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieValue = JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user,
      });
      
      // Set cookie with proper attributes
      const expires = data.expires_at ? new Date(data.expires_at * 1000).toUTCString() : '';
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; ${expires ? `expires=${expires}; ` : ''}SameSite=Lax; Secure`;
      
      return { success: true, userId: data.user?.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    email,
    password,
    supabaseUrl: STAGING_CONFIG.supabaseUrl!,
    supabaseAnonKey: STAGING_CONFIG.supabaseAnonKey!,
  });
  
  if (!signInResult.success) {
    throw new Error(`Programmatic browser sign-in failed: ${signInResult.error}`);
  }
  
  console.log(`✅ Programmatic browser sign-in successful`);
  
  // Small delay to ensure cookies are set
  await page.waitForTimeout(1000);
  
  // Now navigate to the app - user should be authenticated via cookies
  await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for either /app or /onboarding (middleware will redirect if onboarding needed)
  await page.waitForURL(/\/app|\/onboarding/, { timeout: 15000 });
  
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

