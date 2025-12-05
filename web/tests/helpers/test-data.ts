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

    // Get user ID from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (!authUser?.user?.id) {
      console.log(`User ${email} not found - already cleaned up?`);
      return;
    }

    const userId = authUser.user.id;

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

