import { createClient } from "@supabase/supabase-js";
import { STAGING_CONFIG } from "./staging-config";
import { generateTestUser } from "./staging-config";

/**
 * Create a test user programmatically via Supabase Admin API
 * This bypasses the UI sign-up flow and email confirmation requirements
 * User is created with email confirmed but onboarding NOT completed
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
    // Log password for debugging (first 3 chars only for security)
    console.log(`🔐 Creating user with email: ${testUser.email}, password length: ${testUser.password.length}`);
    
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
    
    // Verify user was created and can be retrieved
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    if (verifyError || !verifyUser.user) {
      console.warn(`⚠️  Warning: Could not verify created user: ${verifyError?.message}`);
    } else {
      console.log(`✅ User verified: ${verifyUser.user.email} (confirmed: ${verifyUser.user.email_confirmed_at ? 'yes' : 'no'})`);
    }

    // Create user profile in public.users
    // onboarding_completed is false by default, so user will go through onboarding
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        timezone: "America/New_York",
        streak_count: 0,
        calendar_connected: false,
        onboarding_completed: false, // Explicitly set to false so user goes through onboarding
      });

    if (profileError) {
      // If profile creation fails, try to delete the auth user to clean up
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log(`✅ Created test user programmatically: ${testUser.email} (${userId})`);
    
    // Known issue: admin.createUser() sometimes doesn't set the password correctly
    // Workaround: Update the password after creation to ensure it's properly hashed
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: testUser.password, // Re-set the password to ensure it's properly hashed
    });
    
    if (updateError) {
      console.warn(`⚠️  Warning: Could not update user password: ${updateError.message}`);
    } else {
      console.log(`✅ User password updated/verified after creation`);
    }
    
    // Additional delay to ensure Supabase has fully processed the password update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return testUser;
  } catch (error: any) {
    console.error(`Failed to create test user programmatically:`, error);
    throw error;
  }
}

/**
 * Get or create a pre-seeded test user
 * Reuses existing user if available, otherwise creates a new one
 * This is more efficient for tests that don't need a fresh user each time
 */
export async function getOrCreatePreSeededUser(email?: string) {
  if (!STAGING_CONFIG.supabaseUrl || !STAGING_CONFIG.supabaseServiceRoleKey) {
    throw new Error("Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(
    STAGING_CONFIG.supabaseUrl,
    STAGING_CONFIG.supabaseServiceRoleKey
  );

  // Use provided email or generate a consistent test email
  const testEmail = email || `test-preseeded-${Date.now()}@staging.nextbestmove.app`;
  const testPassword = "TestPassword123!";
  const testName = `Pre-seeded Test User ${Date.now()}`;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", testEmail)
      .single();

    if (existingUser) {
      console.log(`✅ Using existing pre-seeded user: ${testEmail}`);
      return {
        email: testEmail,
        password: testPassword,
        name: testName,
      };
    }

    // Create new user
    return await createTestUserProgrammatically();
  } catch (error: any) {
    console.error(`Failed to get or create pre-seeded user:`, error);
    throw error;
  }
}

