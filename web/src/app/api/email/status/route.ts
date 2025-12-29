import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/email/status
 * 
 * Returns the status of email connections for the authenticated user.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connections, error } = await supabase
      .from("email_connections")
      .select("id, provider, status, email_address, last_sync_at, error_message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching email connections:", error);
      return NextResponse.json(
        { error: "Failed to fetch email connections" },
        { status: 500 }
      );
    }

    const activeConnections = connections?.filter((c) => c.status === "active") || [];
    const hasActiveConnection = activeConnections.length > 0;

    return NextResponse.json({
      connected: hasActiveConnection,
      connections: connections || [],
      activeConnections: activeConnections.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}





