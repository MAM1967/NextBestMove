"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EmailConnection } from "@/lib/email/types";

type EmailConnectionSectionProps = {
  connections: EmailConnection[];
  connected: boolean;
  status: string;
};

function EmailStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    expired: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
    disconnected: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  const labels: Record<string, string> = {
    active: "Connected",
    expired: "Expired",
    error: "Error",
    disconnected: "Not Connected",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
        variants[status] || variants.disconnected
      }`}
    >
      {labels[status] || labels.disconnected}
    </span>
  );
}

export function EmailConnectionSection({
  connections,
  connected,
  status,
}: EmailConnectionSectionProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = (provider: "gmail" | "outlook") => {
    window.location.href = `/api/email/connect/${provider}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your email account?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const provider = connections[0]?.provider;
      const url = provider 
        ? `/api/email/disconnect?provider=${provider}`
        : "/api/email/disconnect";
      
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Failed to disconnect: ${errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to disconnect email. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/email/sync", {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to sync email. Please try again.");
      }
    } catch {
      alert("Failed to sync email. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const connectionLabel = connected
    ? `Connected to ${connections[0]?.provider === "gmail" ? "Gmail" : "Outlook"}`
    : "Not connected";

  const providerLabel = (provider: string) => {
    return provider === "gmail" ? "Gmail" : "Outlook";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">{connectionLabel}</p>
          <p className="text-xs text-zinc-500">
            {connected
              ? "Email signals help identify open loops and topics from your conversations."
              : "Connect your email to see signals and insights from your conversations."}
          </p>
        </div>
        <EmailStatusBadge status={status || "disconnected"} />
      </div>

      {connected && connections.length > 0 && (
        <div className="text-xs text-zinc-500">
          Last sync:{" "}
          {connections[0]?.last_sync_at
            ? new Date(connections[0].last_sync_at).toLocaleString()
            : "Never"}
        </div>
      )}

      {connected && connections[0]?.error_message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          Error: {connections[0].error_message}
        </div>
      )}

      <div className="flex gap-2">
        {!connected ? (
          <>
            <button
              onClick={() => handleConnect("gmail")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Connect Gmail
            </button>
            <button
              onClick={() => handleConnect("outlook")}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Connect Outlook
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {isRefreshing ? "Syncing..." : "Sync Now"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

