import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityForDate, type CapacityInfo } from "./capacity";

export type CalendarConnectionRow = {
  id: string; // Calendar connection ID (for individual disconnect)
  provider: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
  display_name?: string | null; // Display name for the connection (e.g., email address)
};

export type CalendarStatusResponse = {
  connected: boolean;
  provider: string | null;
  status: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  connections: CalendarConnectionRow[];
  activeConnectionCount: number; // Number of active connections (for multi-calendar)
  capacity: CapacityInfo;
};

export async function fetchCalendarStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<CalendarStatusResponse> {
  const [{ data: connections }, capacity] = await Promise.all([
    supabase
      .from("calendar_connections")
      .select("id, provider, status, last_sync_at, error_message, display_name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    getCapacityForDate(supabase, userId, new Date().toISOString().split("T")[0]),
  ]);

  const rows = (connections ?? []) as CalendarConnectionRow[];
  const activeConnections = rows.filter((row) => row.status === "active");
  const activeConnectionCount = activeConnections.length;
  const active = activeConnections[0] ?? rows[0];

  return {
    connected: activeConnectionCount > 0,
    provider: active?.provider ?? null,
    status: active?.status ?? null,
    lastSyncAt: active?.last_sync_at ?? null,
    errorMessage: active?.error_message ?? null,
    connections: rows,
    activeConnectionCount,
    capacity,
  };
}

