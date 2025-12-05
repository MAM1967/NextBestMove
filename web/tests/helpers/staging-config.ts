/**
 * Staging environment configuration for tests
 */

export const STAGING_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://staging.nextbestmove.app",
  stagingUser: process.env.STAGING_USER || "staging",
  stagingPass: process.env.STAGING_PASS || "",
  cronSecret: process.env.CRON_SECRET || "", // CRON_SECRET in Preview scope has staging value
  supabaseUrl: process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "",
} as const;

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@staging.nextbestmove.app`;
}

/**
 * Generate test user data
 */
export function generateTestUser() {
  const email = generateTestEmail();
  const password = "TestPassword123!";
  const name = `Test User ${Date.now()}`;
  
  return { email, password, name };
}

