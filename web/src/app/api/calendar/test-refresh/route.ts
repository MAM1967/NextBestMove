import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, refreshAccessToken } from "@/lib/calendar/tokens";

/**
 * POST /api/calendar/test-refresh
 *
 * Test endpoint to force token refresh without waiting for expiration.
 * Useful for testing token refresh logic and error handling.
 *
 * WARNING: This is a test endpoint - should be restricted in production.
 */
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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
        success: false,
        reason: "No active connection found",
      });
    }

    console.log("[Test Refresh] Forcing token refresh for testing", {
      userId: user.id,
      provider: connection.provider,
      currentStatus: connection.status,
    });

    // Force refresh by calling refreshAccessToken directly
    // Pass hostname from request to ensure staging workaround is applied
    const hostname = request.headers.get("host") || undefined;
    const newAccessToken = await refreshAccessToken(supabase, connection, hostname);

    if (newAccessToken) {
      // Fetch updated connection to get new expires_at
      const { data: updatedConnection } = await supabase
        .from("calendar_connections")
        .select("status, expires_at, last_sync_at, error_message")
        .eq("id", connection.id)
        .single();

      return NextResponse.json({
        success: true,
        message: "Token refreshed successfully",
        provider: connection.provider,
        status: updatedConnection?.status || connection.status,
        expiresAt: updatedConnection?.expires_at
          ? new Date(updatedConnection.expires_at * 1000).toISOString()
          : null,
        lastSyncAt: updatedConnection?.last_sync_at || null,
      });
    } else {
      // Fetch updated connection to get error message
      const { data: updatedConnection } = await supabase
        .from("calendar_connections")
        .select("status, error_message")
        .eq("id", connection.id)
        .single();

      return NextResponse.json({
        success: false,
        message: "Token refresh failed",
        provider: connection.provider,
        status: updatedConnection?.status || connection.status,
        errorMessage: updatedConnection?.error_message || "Unknown error",
        requiresReconnect:
          updatedConnection?.error_message?.includes("deleted_client") ||
          updatedConnection?.error_message?.includes("invalid_client") ||
          updatedConnection?.error_message?.includes("invalid_grant"),
      });
    }
  } catch (error) {
    console.error("[Test Refresh] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
