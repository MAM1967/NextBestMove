import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "morning_plan"
  | "fast_win_reminder"
  | "follow_up_alerts"
  | "weekly_summary";

export type NotificationChannel = "email" | "push";

export interface NotificationChannels {
  email: boolean;
  push: boolean;
}

/**
 * Get enabled channels for a notification type for a user.
 */
export async function getNotificationChannels(
  supabase: SupabaseClient,
  userId: string,
  notificationType: NotificationType
): Promise<NotificationChannels> {
  // Check global unsubscribe first
  const { data: user } = await supabase
    .from("users")
    .select("email_unsubscribed")
    .eq("id", userId)
    .single();

  // If globally unsubscribed, disable all channels
  if (user?.email_unsubscribed) {
    return { email: false, push: false };
  }

  // Get notification preferences
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!preferences) {
    // Fallback to users table for backward compatibility
    const { data: userPrefs } = await supabase
      .from("users")
      .select(
        "email_morning_plan, email_fast_win_reminder, email_follow_up_alerts, email_weekly_summary"
      )
      .eq("id", userId)
      .single();

    if (!userPrefs) {
      return { email: true, push: false }; // Default: email only
    }

    // Map old preferences to new structure
    const emailEnabled =
      (notificationType === "morning_plan" && userPrefs.email_morning_plan) ||
      (notificationType === "fast_win_reminder" &&
        userPrefs.email_fast_win_reminder) ||
      (notificationType === "follow_up_alerts" &&
        userPrefs.email_follow_up_alerts) ||
      (notificationType === "weekly_summary" && userPrefs.email_weekly_summary);

    return { email: emailEnabled ?? true, push: false };
  }

  // Map notification type to preference fields
  const emailField = `${notificationType}_email` as keyof typeof preferences;
  const pushField = `${notificationType}_push` as keyof typeof preferences;

  const emailEnabled =
    (preferences[emailField] as boolean | undefined) ?? true;
  const pushEnabled =
    (preferences[pushField] as boolean | undefined) ?? false;

  return {
    email: emailEnabled,
    push: pushEnabled,
  };
}

/**
 * Get all enabled channels for a notification type.
 * Returns array of enabled channels.
 */
export async function getEnabledChannels(
  supabase: SupabaseClient,
  userId: string,
  notificationType: NotificationType
): Promise<NotificationChannel[]> {
  const channels = await getNotificationChannels(
    supabase,
    userId,
    notificationType
  );

  const enabled: NotificationChannel[] = [];
  if (channels.email) enabled.push("email");
  if (channels.push) enabled.push("push");

  return enabled;
}

