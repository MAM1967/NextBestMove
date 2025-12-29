import { STAGING_CONFIG } from "./staging-config";
import { createClient } from "@supabase/supabase-js";

/**
 * Clean up test user from Supabase
 * Uses service role key to bypass RLS
 */
export async function cleanupTestUser(email: string) {
  if (!STAGING_CONFIG.supabaseUrl || !STAGING_CONFIG.supabaseServiceRoleKey) {
    console.warn("⚠️  Supabase credentials not configured - skipping cleanup");
    return;
  }

  try {
    const supabase = createClient(
      STAGING_CONFIG.supabaseUrl,
      STAGING_CONFIG.supabaseServiceRoleKey
    );

    // Get user ID from public.users table (easier than querying auth.users)
    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (!userRecord?.id) {
      console.log(`User ${email} not found in users table - already cleaned up?`);
      return;
    }

    const userId = userRecord.id;

    // Delete from public.users (cascade should handle related data)
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error(`Failed to delete user ${email}:`, deleteError);
    } else {
      console.log(`✅ Cleaned up test user: ${email}`);
    }

    // Delete from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error(`Failed to delete auth user ${userId}:`, authDeleteError);
    }
  } catch (error) {
    console.error(`Error cleaning up test user ${email}:`, error);
  }
}

/**
 * Auto-confirm a user's email address (for testing)
 * Uses service role key to bypass normal confirmation flow
 */
export async function confirmUserEmail(email: string) {
  if (!STAGING_CONFIG.supabaseUrl || !STAGING_CONFIG.supabaseServiceRoleKey) {
    console.warn("⚠️  Supabase credentials not configured - cannot confirm user");
    console.warn(`   supabaseUrl: ${STAGING_CONFIG.supabaseUrl ? "✅ set" : "❌ missing"}`);
    console.warn(`   supabaseServiceRoleKey: ${STAGING_CONFIG.supabaseServiceRoleKey ? "✅ set" : "❌ missing"}`);
    console.warn(`   Checked env vars: STAGING_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, STAGING_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY`);
    return false;
  }

  try {
    const supabase = createClient(
      STAGING_CONFIG.supabaseUrl,
      STAGING_CONFIG.supabaseServiceRoleKey
    );

    // Retry finding the user (they may not be in DB yet due to async creation)
    let userId: string | null = null;
    const maxRetries = 3; // Reduced retries to avoid timeout
    const retryDelay = 3000; // 3 seconds between retries
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // First try to get user ID from public.users table
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      if (userRecord?.id) {
        userId = userRecord.id;
        break;
      }
      
      // If not in public.users, query auth.users directly via admin API
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && usersData) {
        const authUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (authUser?.id) {
          userId = authUser.id;
          break;
        }
      }
      
      if (attempt < maxRetries) {
        console.log(`   User ${email} not found yet (attempt ${attempt}/${maxRetries}), waiting ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    if (!userId) {
      console.log(`User ${email} not found in auth.users or public.users after ${maxRetries} attempts - cannot confirm`);
      return false;
    }

    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    
    if (error) {
      console.error(`Failed to confirm user ${email}:`, error);
      return false;
    }
    
    console.log(`✅ Confirmed email for user: ${email} (${userId})`);
    return true;
  } catch (error) {
    console.error(`Error confirming user email ${email}:`, error);
    return false;
  }
}

/**
 * Wait for staging deployment to be ready
 * Checks if the site is accessible
 */
export async function waitForStagingDeployment(page: { goto: (url: string) => Promise<unknown> }, maxWait = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await page.goto(STAGING_CONFIG.baseURL, { timeout: 10000 });
      if (response && response.status() < 500) {
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error("Staging deployment not ready after timeout");
}

