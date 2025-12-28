"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { EmailSignals } from "@/lib/email/types";
import { formatDistanceToNow } from "date-fns";

export function SignalsClient() {
  const [signals, setSignals] = useState<EmailSignals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEmailConnection, setHasEmailConnection] = useState(false);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        // Check email connection status
        const statusResponse = await fetch("/api/email/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setHasEmailConnection(statusData.connected || false);
        }

        // Fetch signals
        const response = await fetch("/api/email/signals");
        if (!response.ok) {
          if (response.status === 404) {
            // No signals yet, that's okay
            setSignals([]);
            return;
          }
          throw new Error("Failed to fetch signals");
        }
        const data = await response.json();
        setSignals(data.signals || []);
      } catch (err) {
        console.error("Error fetching signals:", err);
        setError(err instanceof Error ? err.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <p className="text-zinc-600">Loading signals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!hasEmailConnection) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <p className="mb-2 text-lg font-medium text-zinc-900">
          Connect Your Email to See Signals
        </p>
        <p className="mb-4 text-sm text-zinc-600">
          Connect your Gmail or Outlook account to see email signals, open loops, and topics from
          your conversations.
        </p>
        <Link
          href="/app/settings"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <p className="mb-2 text-lg font-medium text-zinc-900">No Signals Yet</p>
        <p className="text-sm text-zinc-600">
          Signals will appear here as we analyze your email conversations. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <div
          key={signal.relationship_id || "unknown"}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900">
                {signal.relationship_name || "Unknown Relationship"}
              </h3>
              {signal.last_email_received && (
                <p className="mt-1 text-xs text-zinc-500">
                  Last email: {formatDistanceToNow(new Date(signal.last_email_received), { addSuffix: true })}
                </p>
              )}
            </div>
            {signal.relationship_id && (
              <Link
                href={`/app/leads/${signal.relationship_id}`}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
              >
                View →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Unread Count */}
            {signal.unread_count > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-600">Unread</div>
                <div className="mt-1 text-sm font-semibold text-orange-600">
                  {signal.unread_count} emails
                </div>
              </div>
            )}

            {/* Recent Topics */}
            {signal.recent_topics.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-600">Topics</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {signal.recent_topics.slice(0, 5).map((topic, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Open Loops */}
            {signal.recent_open_loops.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-orange-700">Open Loops</div>
                <ul className="mt-1 space-y-1">
                  {signal.recent_open_loops.slice(0, 3).map((loop, index) => (
                    <li key={index} className="text-sm font-medium text-orange-800">
                      ⚠️ {loop}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Asks */}
            {signal.recent_asks.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-600">Recent Asks</div>
                <ul className="mt-1 space-y-1">
                  {signal.recent_asks.slice(0, 3).map((ask, index) => (
                    <li key={index} className="text-sm text-zinc-700">• {ask}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}






