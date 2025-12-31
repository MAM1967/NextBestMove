"use client";

import { useState, useEffect } from "react";
import type { EmailSignals } from "@/lib/email/types";
import { formatDistanceToNow } from "date-fns";

interface RelationshipSignalsProps {
  relationshipId: string;
}

export function RelationshipSignals({ relationshipId }: RelationshipSignalsProps) {
  const [signals, setSignals] = useState<EmailSignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch(`/api/email/signals/relationship/${relationshipId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // No signals yet, that's okay
            setSignals(null);
            return;
          }
          throw new Error("Failed to fetch signals");
        }
        const data = await response.json();
        // API returns { relationship_id, relationship_name, emails }
        // Transform to match EmailSignals type expected by component
        if (data.emails && data.emails.length > 0) {
          const lastEmail = data.emails[0];
          setSignals({
            relationship_id: data.relationship_id,
            relationship_name: data.relationship_name,
            last_email_received: lastEmail.received_at,
            unread_count: 0, // TODO: Calculate from email_metadata if we track read status
            recent_topics: data.emails
              .map((e: any) => e.last_topic)
              .filter((t: string | null) => t !== null),
            recent_asks: data.emails
              .map((e: any) => e.ask)
              .filter((a: string | null) => a !== null),
            recent_open_loops: Array.isArray(lastEmail.open_loops) 
              ? lastEmail.open_loops 
              : [],
            recent_labels: [],
            // AI fields from most recent email
            last_email_sentiment: lastEmail.sentiment || null,
            last_email_intent: lastEmail.intent || null,
            recommended_action_type: lastEmail.recommended_action_type || null,
            recommended_action_description: lastEmail.recommended_action_description || null,
            recommended_due_date: lastEmail.recommended_due_date || null,
          });
        } else {
          setSignals(null);
        }
      } catch (err) {
        console.error("Error fetching signals:", err);
        setError(err instanceof Error ? err.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [relationshipId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-600">Loading signals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!signals) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-2 text-lg font-semibold text-zinc-900">Email Signals</h3>
        <p className="text-sm text-zinc-600">
          No email signals available. Connect your email account in Settings to see signals from
          your email conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">Email Signals</h3>
      
      <div className="space-y-4">
        {/* Last Email */}
        {signals.last_email_received && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Last Email</div>
            <div className="mt-1 text-sm text-zinc-900">
              {formatDistanceToNow(new Date(signals.last_email_received), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Unread Count */}
        {signals.unread_count > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Unread Emails</div>
            <div className="mt-1 text-sm font-semibold text-orange-600">
              {signals.unread_count} unread
            </div>
          </div>
        )}

        {/* Recent Topics */}
        {signals.recent_topics.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Recent Topics</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {signals.recent_topics.slice(0, 5).map((topic, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Asks */}
        {signals.recent_asks.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Recent Asks</div>
            <ul className="mt-1 space-y-1">
              {signals.recent_asks.slice(0, 3).map((ask, index) => (
                <li key={index} className="text-sm text-zinc-700">
                  • {ask}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Loops */}
        {signals.recent_open_loops.length > 0 && (
          <div>
            <div className="text-xs font-medium text-orange-700">Open Loops</div>
            <ul className="mt-1 space-y-1">
              {signals.recent_open_loops.slice(0, 3).map((loop, index) => (
                <li key={index} className="text-sm font-medium text-orange-800">
                  ⚠️ {loop}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Labels */}
        {signals.recent_labels.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Labels</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {signals.recent_labels.slice(0, 5).map((label, index) => (
                <span
                  key={index}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment */}
        {signals.last_email_sentiment && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Sentiment</div>
            <div className="mt-1">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  signals.last_email_sentiment === "positive"
                    ? "bg-green-100 text-green-800"
                    : signals.last_email_sentiment === "negative"
                    ? "bg-red-100 text-red-800"
                    : signals.last_email_sentiment === "urgent"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                {signals.last_email_sentiment}
              </span>
            </div>
          </div>
        )}

        {/* Intent */}
        {signals.last_email_intent && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Intent</div>
            <div className="mt-1">
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {signals.last_email_intent.replace("_", " ")}
              </span>
            </div>
          </div>
        )}

        {/* Recommended Action */}
        {signals.recommended_action_type && (
          <div>
            <div className="text-xs font-medium text-purple-700">Recommended Action</div>
            <div className="mt-1 space-y-1">
              <div className="text-sm font-medium text-purple-900">
                {signals.recommended_action_type.replace("_", " ")}
              </div>
              {signals.recommended_action_description && (
                <p className="text-sm text-zinc-700">{signals.recommended_action_description}</p>
              )}
              {signals.recommended_due_date && (
                <p className="text-xs text-zinc-600">
                  Suggested due: {new Date(signals.recommended_due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





