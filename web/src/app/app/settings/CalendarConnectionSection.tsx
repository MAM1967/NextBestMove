"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CalendarConnection = {
  id?: string; // Calendar connection ID (for individual disconnect)
  provider: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
  display_name?: string | null;
};

type CalendarConnectionSectionProps = {
  connections: CalendarConnection[];
  connected: boolean;
  status: string;
  activeConnectionCount?: number; // Number of active connections (for multi-calendar)
  capacity?: {
    calendarCount?: number;
    confidence?: "high" | "medium" | "low";
  };
};

export function CalendarConnectionSection({
  connections,
  connected,
  status,
  activeConnectionCount,
  capacity,
}: CalendarConnectionSectionProps) {
  const router = useRouter();
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(
    new Set()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = (provider: "google" | "outlook") => {
    window.location.href = `/api/calendar/connect/${provider}`;
  };

  const handleDisconnect = async (connectionId?: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    const connectionLabel = connection
      ? `${connection.provider}${connection.display_name ? ` (${connection.display_name})` : ""}`
      : "this calendar";

    if (
      !confirm(`Are you sure you want to disconnect ${connectionLabel}?`)
    ) {
      return;
    }

    // If no connectionId provided, disconnect all (backward compatibility)
    if (!connectionId) {
      // Disconnect all calendars
      try {
        const response = await fetch("/api/calendar/disconnect", {
          method: "DELETE",
        });

        if (response.ok) {
          router.refresh();
        } else {
          const errorData = await response.json();
          alert(`Failed to disconnect: ${errorData.error || "Unknown error"}`);
        }
      } catch {
        alert("Failed to disconnect calendar. Please try again.");
      }
      return;
    }

    // Disconnect specific calendar
    setDisconnectingIds((prev) => new Set(prev).add(connectionId));
    try {
      const response = await fetch(`/api/calendar/disconnect/${connectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(
          `Failed to disconnect ${connectionLabel}: ${errorData.error || "Unknown error"}`
        );
      }
    } catch {
      alert(`Failed to disconnect ${connectionLabel}. Please try again.`);
    } finally {
      setDisconnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate cache first
      await fetch("/api/calendar/refresh-cache", {
        method: "POST",
      });

      // Then fetch free/busy for today to refresh cache
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/calendar/freebusy?date=${today}`, {
        method: "GET",
      });

      if (response.ok) {
        // Refresh the page to show updated last_sync_at
        router.refresh();
      } else {
        alert("Failed to refresh calendar. Please try again.");
      }
    } catch {
      alert("Failed to refresh calendar. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeConnections = connections.filter((c) => c.status === "active");
  const connectionCount = activeConnectionCount ?? activeConnections.length;

  // Generate confidence label
  const confidenceLabel =
    capacity?.calendarCount && capacity.calendarCount > 1
      ? `Based on ${capacity.calendarCount} calendars`
      : capacity?.calendarCount === 1
      ? "Based on 1 calendar"
      : null;

  const connectionLabel = connected
    ? connectionCount > 1
      ? `Connected to ${connectionCount} calendars`
      : `Connected to ${connections[0]?.provider || "calendar"}`
    : "Not connected";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">{connectionLabel}</p>
          <p className="text-xs text-zinc-500">
            {connected
              ? confidenceLabel
                ? `Capacity adapts to your calendar schedule (${confidenceLabel}${capacity?.confidence === "high" ? " - high confidence" : capacity?.confidence === "medium" ? " - medium confidence" : ""}).`
                : "Capacity adapts to your calendar schedule automatically."
              : "We'll default to 6 actions/day until a calendar is connected."}
          </p>
        </div>
        <CalendarStatusBadge status={status || "disconnected"} />
      </div>

      {connections.length > 0 ? (
        <div className="space-y-2" data-testid="calendar-list">
          {connections.map((conn) => {
            const isDisconnecting = conn.id
              ? disconnectingIds.has(conn.id)
              : false;
            const providerLabel =
              conn.provider === "google" ? "Google Calendar" : "Outlook Calendar";
            const displayName = conn.display_name || providerLabel;

            return (
              <div
                key={conn.id || `${conn.provider}-${conn.status}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
                data-testid={`calendar-item-${conn.id || conn.provider}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {displayName}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          conn.status === "active"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : conn.status === "expired"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : conn.status === "error"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {conn.status}
                      </span>
                    </div>
                    {conn.last_sync_at && (
                      <p className="text-xs text-zinc-500">
                        Last sync:{" "}
                        {new Date(conn.last_sync_at).toLocaleString()}
                      </p>
                    )}
                    {conn.error_message && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-medium text-red-600">
                          Error: {conn.error_message}
                        </p>
                        {(conn.error_message.includes("OAuth client mismatch") ||
                          conn.error_message.includes("invalid_client") ||
                          conn.error_message.includes("deleted_client") ||
                          conn.error_message.includes("OAuth client was deleted")) && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <p className="text-xs text-amber-800 mb-2">
                              {conn.error_message.includes("deleted_client") ||
                              conn.error_message.includes("OAuth client was deleted")
                                ? "The OAuth client used to connect this calendar has been deleted or changed. Please reconnect with the current OAuth client."
                                : "This error usually means the OAuth client credentials changed. Please disconnect and reconnect this calendar."}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                // Disconnect first
                                if (conn.id) {
                                  await handleDisconnect(conn.id);
                                } else {
                                  await handleDisconnect();
                                }
                                // Then reconnect
                                setTimeout(() => {
                                  handleConnect(
                                    conn.provider as "google" | "outlook"
                                  );
                                }, 500);
                              }}
                              className="text-xs font-medium text-amber-900 hover:text-amber-950 underline"
                            >
                              Reconnect Calendar →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    data-testid={`disconnect-calendar-${conn.id || conn.provider}`}
                    onClick={() => handleDisconnect(conn.id)}
                    disabled={isDisconnecting}
                    className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-xs text-zinc-600">
          Connect your calendar to enable capacity-based daily plans.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {connected && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh All Calendars"}
          </button>
        )}
        <button
          type="button"
          data-testid="connect-google-calendar"
          onClick={() => handleConnect("google")}
          className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Connect Google Calendar
        </button>
        <button
          type="button"
          data-testid="connect-outlook-calendar"
          onClick={() => handleConnect("outlook")}
          className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Connect Outlook Calendar
        </button>
      </div>
    </div>
  );
}

function CalendarStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
      label: "Connected",
      className: "bg-green-100 text-green-800",
    },
    expired: {
      label: "Expired",
      className: "bg-yellow-100 text-yellow-800",
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-800",
    },
    disconnected: {
      label: "Not connected",
      className: "bg-zinc-100 text-zinc-600",
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
