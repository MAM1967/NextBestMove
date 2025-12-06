import { createClient } from "@supabase/supabase-js";
import { STAGING_CONFIG } from "./staging-config";
import { generateTestUser } from "./staging-config";

/**
 * Create a test user programmatically via Supabase Admin API
 * This bypasses the UI sign-up flow and email confirmation requirements
 */
export async function createTestUserProgrammatically() {
  if (!STAGING_CONFIG.supabaseUrl || !STAGING_CONFIG.supabaseServiceRoleKey) {
    throw new Error("Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const testUser = generateTestUser();
  const supabase = createClient(
    STAGING_CONFIG.supabaseUrl,
    STAGING_CONFIG.supabaseServiceRoleKey
  );

  try {
    // Create user in auth.users via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: testUser.name,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message || "Unknown error"}`);
    }

    const userId = authData.user.id;

    // Create user profile in public.users
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        timezone: "America/New_York",
        streak_count: 0,
        calendar_connected: false,
      });

    if (profileError) {
      // If profile creation fails, try to delete the auth user to clean up
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log(`✅ Created test user programmatically: ${testUser.email} (${userId})`);
    return testUser;
  } catch (error: any) {
    console.error(`Failed to create test user programmatically:`, error);
    throw error;
  }
}

