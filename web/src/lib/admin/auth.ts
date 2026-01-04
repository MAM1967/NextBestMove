import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if the current user is an admin (service role).
 * In production, this should check against a list of admin user IDs or use service role.
 */
export async function isAdmin(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // For now, check if user email is in admin list
    // TODO: Create admin_users table or use service role authentication
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) =>
      e.trim()
    ) || [];

    if (adminEmails.includes(user.email || "")) {
      return true;
    }

    // Alternative: Check user metadata for admin flag
    const { data: userProfile } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userProfile && adminEmails.includes(userProfile.email)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin Supabase client (service role).
 * Use this for admin operations that need to bypass RLS.
 */
export function getAdminClient(): SupabaseClient {
  return createAdminClient();
}

