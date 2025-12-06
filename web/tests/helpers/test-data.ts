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
    return false;
  }

  try {
    const supabase = createClient(
      STAGING_CONFIG.supabaseUrl,
      STAGING_CONFIG.supabaseServiceRoleKey
    );

    // First try to get user ID from public.users table
    let userId: string | null = null;
    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (userRecord?.id) {
      userId = userRecord.id;
    } else {
      // If not in public.users, query auth.users directly via admin API
      // List users and find by email (admin API doesn't have getUserByEmail)
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`Failed to list users:`, listError);
        return false;
      }
      
      const authUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (authUser?.id) {
        userId = authUser.id;
      }
    }
    
    if (!userId) {
      console.log(`User ${email} not found in auth.users or public.users - cannot confirm`);
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
export async function waitForStagingDeployment(page: any, maxWait = 60000) {
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

