"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GlobalSignalsData {
  totalEmails: number;
  emailsWithAsks: number;
  emailsWithOpenLoops: number;
  recentHighPriority: Array<{
    id: string;
    subject: string;
    snippet: string;
    receivedAt: string;
    topic: string | null;
    ask: string | null;
    relationshipName: string;
    relationshipId: string | null;
  }>;
  recentOpenLoops: Array<{
    id: string;
    subject: string;
    snippet: string;
    receivedAt: string;
    openLoops: string[];
    relationshipName: string;
    relationshipId: string | null;
  }>;
}

export function GlobalSignals() {
  const [signals, setSignals] = useState<GlobalSignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/email/signals");
        if (!response.ok) {
          throw new Error("Failed to load signals");
        }
        const data = await response.json();
        setSignals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
    registerServiceWorker();
  }, []);

  // Register service worker for push notifications
  async function registerServiceWorker() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Get subscription
          // TODO: Add VAPID public key from environment variable
          // For now, skip subscription until VAPID keys are configured
          // const subscription = await registration.pushManager.subscribe({
          //   userVisibleOnly: true,
          //   applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          // });
          // Register token with backend
          // if (subscription) {
          //   const response = await fetch("/api/notifications/push/register", {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({
          //       token: JSON.stringify(subscription),
          //       platform: "web",
          //     }),
          //   });
          //   if (!response.ok) {
          //     console.error("Failed to register push token");
          //   }
          // }
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-gray-500">Loading email signals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!signals || signals.totalEmails === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Email Signals
        </h3>
        <p className="text-sm text-gray-500">
          No email signals found. Connect your email account to see signals.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Email Signals Overview
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {signals.totalEmails}
            </div>
            <div className="text-xs text-gray-500">Recent Emails</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {signals.emailsWithAsks}
            </div>
            <div className="text-xs text-gray-500">With Asks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {signals.emailsWithOpenLoops}
            </div>
            <div className="text-xs text-gray-500">Open Loops</div>
          </div>
        </div>
      </div>

      {signals.recentHighPriority.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            High Priority
          </h4>
          <div className="space-y-2">
            {signals.recentHighPriority.slice(0, 3).map((email) => (
              <div
                key={email.id}
                className="p-2 bg-red-50 border border-red-200 rounded text-xs"
              >
                <div className="flex items-start justify-between mb-1">
                  <Link
                    href={
                      email.relationshipId
                        ? `/app/leads?leadId=${email.relationshipId}`
                        : "#"
                    }
                    className="font-medium text-red-900 hover:underline"
                  >
                    {email.relationshipName}
                  </Link>
                  <span className="text-red-600">
                    {formatDate(email.receivedAt)}
                  </span>
                </div>
                <p className="text-red-800 font-medium mb-1">
                  {email.subject || "No subject"}
                </p>
                {email.ask && (
                  <p className="text-red-700 italic">Ask: {email.ask}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {signals.recentOpenLoops.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Recent Open Loops
          </h4>
          <div className="space-y-2">
            {signals.recentOpenLoops.slice(0, 3).map((email) => (
              <div
                key={email.id}
                className="p-2 bg-orange-50 border border-orange-200 rounded text-xs"
              >
                <div className="flex items-start justify-between mb-1">
                  <Link
                    href={
                      email.relationshipId
                        ? `/app/leads?leadId=${email.relationshipId}`
                        : "#"
                    }
                    className="font-medium text-orange-900 hover:underline"
                  >
                    {email.relationshipName}
                  </Link>
                  <span className="text-orange-600">
                    {formatDate(email.receivedAt)}
                  </span>
                </div>
                <p className="text-orange-800 font-medium mb-1">
                  {email.subject || "No subject"}
                </p>
                <ul className="space-y-1">
                  {email.openLoops.slice(0, 2).map((loop, idx) => (
                    <li
                      key={idx}
                      className="text-orange-700 pl-2 border-l-2 border-orange-300"
                    >
                      {loop}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
