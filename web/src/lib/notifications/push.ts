import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "./channels";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string; // For grouping notifications
  requireInteraction?: boolean;
}

/**
 * Send push notification to a user.
 * This is a placeholder for future implementation with Web Push API.
 */
export async function sendPushNotification(
  supabase: SupabaseClient,
  userId: string,
  notificationType: NotificationType,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all push tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from("push_notification_tokens")
      .select("token, platform")
      .eq("user_id", userId);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return { success: false, error: tokensError.message };
    }

    if (!tokens || tokens.length === 0) {
      // No tokens registered - this is okay, just return success
      return { success: true };
    }

    // TODO: Implement actual push notification sending
    // For web: Use Web Push API with service worker
    // For iOS: Use APNs
    // For Android: Use FCM
    // For now, just log that we would send
    console.log(`Would send push notification to ${tokens.length} device(s):`, {
      userId,
      notificationType,
      payload,
    });

    // In a real implementation, you would:
    // 1. Get VAPID keys from environment
    // 2. For each token, send via appropriate service (Web Push API, APNs, FCM)
    // 3. Handle errors (expired tokens, etc.) and clean up invalid tokens

    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Register a push notification token for a user.
 */
export async function registerPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  platform: "web" | "ios" | "android",
  deviceId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate token format
    if (!token || token.length < 10) {
      return { success: false, error: "Invalid token format" };
    }

    // Upsert token (update if exists, insert if new)
    const { error } = await supabase.from("push_notification_tokens").upsert(
      {
        user_id: userId,
        token,
        platform,
        device_id: deviceId || null,
      },
      {
        onConflict: "user_id,token",
      }
    );

    if (error) {
      console.error("Error registering push token:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error registering push token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unregister a push notification token.
 */
export async function unregisterPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("push_notification_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);

    if (error) {
      console.error("Error unregistering push token:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error unregistering push token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

