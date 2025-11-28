"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CalendarConnection = {
  provider: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
};

type CalendarConnectionSectionProps = {
  connections: CalendarConnection[];
  connected: boolean;
  status: string;
};

export function CalendarConnectionSection({
  connections,
  connected,
  status,
}: CalendarConnectionSectionProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = (provider: "google" | "outlook") => {
    window.location.href = `/api/calendar/connect/${provider}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your calendar?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/calendar/disconnect", {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to disconnect: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Failed to disconnect calendar. Please try again.");
    } finally {
      setIsDisconnecting(false);
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
    } catch (error) {
      alert("Failed to refresh calendar. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const connectionLabel = connected
    ? `Connected to ${connections[0]?.provider || "calendar"}`
    : "Not connected";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">{connectionLabel}</p>
          <p className="text-xs text-zinc-500">
            {connected
              ? "Capacity adapts to your calendar schedule automatically."
              : "We'll default to 6 actions/day until a calendar is connected."}
          </p>
        </div>
        <CalendarStatusBadge status={status || "disconnected"} />
      </div>

      {connections.length > 0 ? (
        <div className="space-y-2 text-xs text-zinc-600">
          {connections.map((conn) => (
            <div
              key={`${conn.provider}-${conn.status}`}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
            >
              <p className="font-medium capitalize text-zinc-900">
                {conn.provider}
              </p>
              <p>Status: {conn.status}</p>
              <p>
                Last sync:{" "}
                {conn.last_sync_at
                  ? new Date(conn.last_sync_at).toLocaleString()
                  : "never"}
              </p>
              {conn.error_message && (
                <p className="text-red-600">Error: {conn.error_message}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-xs text-zinc-600">
          Connect your calendar to enable capacity-based daily plans.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <>
            <button
              type="button"
              onClick={() => handleConnect("google")}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Connect Google
            </button>
            <button
              type="button"
              onClick={() => handleConnect("outlook")}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Connect Outlook
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Calendar"}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </>
        )}
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

