import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailConnection } from "./types";

export interface EmailConnectionStatus {
  connections: EmailConnection[];
  connected: boolean;
  status: "active" | "expired" | "error" | "disconnected";
}

/**
 * Fetch email connection status for a user
 * Similar to calendar status fetching pattern
 */
export async function fetchEmailStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<EmailConnectionStatus> {
  const { data: connections, error } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching email connections:", error);
    return {
      connections: [],
      connected: false,
      status: "disconnected",
    };
  }

  const activeConnections = (connections || []).filter(
    (conn) => conn.status === "active"
  );

  const connected = activeConnections.length > 0;
  
  // Determine overall status
  let status: "active" | "expired" | "error" | "disconnected" = "disconnected";
  if (connected) {
    // Check if any connection has errors
    const hasError = connections?.some((conn) => conn.status === "error");
    if (hasError) {
      status = "error";
    } else {
      // Check if any connection is expired
      const hasExpired = connections?.some((conn) => conn.status === "expired");
      if (hasExpired && !hasError) {
        status = "expired";
      } else {
        status = "active";
      }
    }
  }

  return {
    connections: connections || [],
    connected,
    status,
  };
}




