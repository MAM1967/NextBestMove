import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityForDate, type CapacityInfo } from "./capacity";

export type CalendarConnectionRow = {
  provider: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
};

export type CalendarStatusResponse = {
  connected: boolean;
  provider: string | null;
  status: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  connections: CalendarConnectionRow[];
  capacity: CapacityInfo;
};

export async function fetchCalendarStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<CalendarStatusResponse> {
  const [{ data: connections }, capacity] = await Promise.all([
    supabase
      .from("calendar_connections")
      .select("provider, status, last_sync_at, error_message")
      .eq("user_id", userId),
    getCapacityForDate(supabase, userId, new Date().toISOString().split("T")[0]),
  ]);

  const rows = connections ?? [];
  const active = rows.find((row) => row.status === "active") ?? rows[0];

  return {
    connected: Boolean(active && active.status === "active"),
    provider: active?.provider ?? null,
    status: active?.status ?? null,
    lastSyncAt: active?.last_sync_at ?? null,
    errorMessage: active?.error_message ?? null,
    connections: rows,
    capacity,
  };
}

