import { createClient } from "@/lib/supabase/server";

/**
 * Ensures a user profile exists in the users table.
 * Creates it if missing, using data from auth.users.
 */
export async function ensureUserProfile(userId: string) {
  const supabase = await createClient();

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (existingProfile) {
    return { exists: true, profile: existingProfile };
  }

  // Get user metadata from auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exists: false, error: "User not found in auth" };
  }

  // Extract name from user metadata or email
  const name =
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "User";

  // Create profile
  const { data: profile, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email: user.email!,
      name,
      timezone: "America/New_York",
      streak_count: 0,
      calendar_connected: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user profile:", error);
    return { exists: false, error: error.message };
  }

  return { exists: true, profile, created: true };
}







