"use client";

import { useEffect, useState } from "react";

interface EmailSignal {
  id: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  topic: string | null;
  ask: string | null;
  openLoops: string[];
  priority: "high" | "medium" | "low" | "normal" | null;
  labels: string[];
}

interface SignalsProps {
  leadId: string;
}

export function Signals({ leadId }: SignalsProps) {
  const [signals, setSignals] = useState<EmailSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leads/${leadId}/signals`);
        if (!response.ok) {
          throw new Error("Failed to load signals");
        }
        const data = await response.json();
        setSignals(data.signals || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      fetchSignals();
    }
  }, [leadId]);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Loading email signals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Signals</h3>
        <p className="text-sm text-gray-500">
          No email signals found. Connect your email account to see signals from this relationship.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Email Signals</h3>
      <div className="space-y-4">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{signal.subject || "No subject"}</h4>
                <p className="text-xs text-gray-500 mt-1">{formatDate(signal.receivedAt)}</p>
              </div>
              {signal.priority && (
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getPriorityColor(
                    signal.priority
                  )}`}
                >
                  {signal.priority}
                </span>
              )}
            </div>

            {signal.snippet && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{signal.snippet}</p>
            )}

            {signal.topic && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">Topic: </span>
                <span className="text-xs text-gray-700">{signal.topic}</span>
              </div>
            )}

            {signal.ask && (
              <div className="mb-2 p-2 bg-blue-50 rounded">
                <span className="text-xs font-medium text-blue-700">Ask: </span>
                <span className="text-xs text-blue-600">{signal.ask}</span>
              </div>
            )}

            {signal.openLoops && signal.openLoops.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">Open loops: </span>
                <ul className="mt-1 space-y-1">
                  {signal.openLoops.map((loop, idx) => (
                    <li key={idx} className="text-xs text-gray-700 pl-2 border-l-2 border-orange-200">
                      {loop}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {signal.labels && signal.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {signal.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}






