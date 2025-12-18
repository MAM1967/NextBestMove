import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, getValidAccessToken } from "@/lib/calendar/tokens";
import { fetchGoogleFreeBusy } from "@/lib/calendar/freebusy-google";
import { fetchOutlookFreeBusy } from "@/lib/calendar/freebusy-outlook";

/**
 * POST /api/calendar/validate
 * 
 * Proactively validates calendar connection by attempting a test API call.
 * Used for testing and monitoring connection health.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await getActiveConnection(supabase, user.id);
    if (!connection) {
      return NextResponse.json({
        valid: false,
        reason: "No active connection",
      });
    }

    // Get valid access token (will refresh if needed)
    const accessToken = await getValidAccessToken(supabase, connection);
    if (!accessToken) {
      // Fetch connection with error_message
      const { data: connData } = await supabase
        .from("calendar_connections")
        .select("error_message")
        .eq("id", connection.id)
        .single();

      return NextResponse.json({
        valid: false,
        reason: "Failed to get access token",
        connectionStatus: connection.status,
        errorMessage: connData?.error_message || null,
      });
    }

    // Get user timezone
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone, work_start_time, work_end_time")
      .eq("id", user.id)
      .single();

    const timezone = userProfile?.timezone || "UTC";
    const workStartTime = userProfile?.work_start_time
      ? userProfile.work_start_time.substring(0, 5)
      : "09:00";
    const workEndTime = userProfile?.work_end_time
      ? userProfile.work_end_time.substring(0, 5)
      : "17:00";

    // Test with a free/busy call for today
    const today = new Date().toISOString().split("T")[0];
    try {
      if (connection.provider === "google") {
        await fetchGoogleFreeBusy(
          accessToken,
          today,
          timezone,
          workStartTime,
          workEndTime
        );
      } else if (connection.provider === "outlook") {
        await fetchOutlookFreeBusy(
          accessToken,
          today,
          timezone,
          workStartTime,
          workEndTime
        );
      } else {
        return NextResponse.json({
          valid: false,
          reason: `Unsupported provider: ${connection.provider}`,
        });
      }

      // Update last_sync_at on successful validation
      await supabase
        .from("calendar_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);

      return NextResponse.json({
        valid: true,
        provider: connection.provider,
        lastSyncAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const errorObj = error as { isAuthError?: boolean; message?: string };
      if (errorObj?.isAuthError) {
        return NextResponse.json({
          valid: false,
          reason: "Authentication error",
          error: errorObj.message || "Token validation failed",
          requiresReconnect: true,
        });
      }

      return NextResponse.json({
        valid: false,
        reason: "API call failed",
        error: errorObj?.message || String(error),
      });
    }
  } catch (error) {
    console.error("[Calendar Validate] Error:", error);
    return NextResponse.json(
      {
        valid: false,
        reason: "Internal error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

