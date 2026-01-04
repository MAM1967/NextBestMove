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
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/email/signals/relationship/${relationshipId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // No signals yet, that's okay
            setSignals(null);
            setLoading(false);
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch signals");
        }
        const data = await response.json();
        
        // Debug logging
        console.log(`[RelationshipSignals] Fetched data for ${relationshipId}:`, {
          emailCount: data.emails?.length || 0,
          hasEmails: !!data.emails && data.emails.length > 0,
        });
        
        // API returns { relationship_id, relationship_name, emails }
        // Transform to match EmailSignals type expected by component
        if (data.emails && data.emails.length > 0) {
          const lastEmail = data.emails[0];
          
          // Collect topics - prefer comprehensive topics array, fallback to last_topic
          const topics = lastEmail.topics_comprehensive && Array.isArray(lastEmail.topics_comprehensive) && lastEmail.topics_comprehensive.length > 0
            ? lastEmail.topics_comprehensive
            : data.emails
                .map((e: any) => e.last_topic)
                .filter((t: string | null) => t !== null);
          
          // Collect asks - prefer comprehensive asks_from_sender, fallback to ask
          const asks = lastEmail.asks_from_sender && Array.isArray(lastEmail.asks_from_sender) && lastEmail.asks_from_sender.length > 0
            ? lastEmail.asks_from_sender
            : data.emails
                .map((e: any) => e.ask)
                .filter((a: string | null) => a !== null);
          
          setSignals({
            relationship_id: data.relationship_id,
            relationship_name: data.relationship_name,
            last_email_received: lastEmail.received_at,
            unread_count: 0, // TODO: Calculate from email_metadata if we track read status
            recent_topics: topics,
            recent_asks: asks,
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
            // Comprehensive signal fields
            thread_summary_1l: lastEmail.thread_summary_1l || null,
            thread_summary_detail: lastEmail.thread_summary_detail || null,
            primary_category: lastEmail.primary_category || null,
            secondary_categories: lastEmail.secondary_categories || null,
            suggested_next_actions: lastEmail.suggested_next_actions || null,
            attachments: lastEmail.attachments || null,
            links: lastEmail.links || null,
            relationship_signal: lastEmail.relationship_signal || null,
          });
        } else {
          console.log(`[RelationshipSignals] No emails found for relationship ${relationshipId}`);
          setSignals(null);
        }
      } catch (err) {
        console.error("[RelationshipSignals] Error fetching signals:", err);
        setError(err instanceof Error ? err.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    };

    if (relationshipId) {
      fetchSignals();
    }
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
        {/* 1-line Summary */}
        {signals.thread_summary_1l && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-medium text-blue-700 mb-1">Summary</div>
            <div className="text-sm text-zinc-900">{signals.thread_summary_1l}</div>
          </div>
        )}

        {/* Signal Strength */}
        {signals.relationship_signal && (
          <div>
            <div className="text-xs font-medium text-zinc-600 mb-1">Signal Strength</div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  signals.relationship_signal.strength === "High"
                    ? "bg-red-100 text-red-800"
                    : signals.relationship_signal.strength === "Medium"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {signals.relationship_signal.strength}
              </span>
              <span className="text-xs text-zinc-600">
                {signals.relationship_signal.signal_type}
              </span>
            </div>
            {signals.relationship_signal.evidence.length > 0 && (
              <ul className="mt-2 space-y-1">
                {signals.relationship_signal.evidence.slice(0, 3).map((evidence, index) => (
                  <li key={index} className="text-xs text-zinc-600">
                    • {evidence}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Asks */}
        {signals.recent_asks.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600 mb-2">Asks</div>
            <ul className="space-y-2">
              {signals.recent_asks.slice(0, 5).map((ask, index) => (
                <li key={index} className="text-sm text-zinc-700 bg-blue-50 p-2 rounded">
                  {ask}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics */}
        {signals.recent_topics.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600 mb-2">Topics</div>
            <div className="flex flex-wrap gap-2">
              {signals.recent_topics.map((topic, index) => (
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

        {/* Next Actions */}
        {signals.suggested_next_actions && signals.suggested_next_actions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600 mb-2">Next Actions</div>
            <ul className="space-y-2">
              {signals.suggested_next_actions.map((action, index) => (
                <li key={index} className="text-sm text-zinc-700 bg-purple-50 p-2 rounded">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attachments to Review */}
        {signals.attachments && signals.attachments.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="text-xs font-medium text-orange-700 mb-2">Attachments to Review</div>
            <ul className="space-y-2">
              {signals.attachments.map((attachment, index) => (
                <li key={index} className="text-sm text-zinc-700">
                  <div className="font-medium">{attachment.filename}</div>
                  <div className="text-xs text-zinc-600">{attachment.type} • {attachment.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links */}
        {signals.links && signals.links.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600 mb-2">Links</div>
            <ul className="space-y-1">
              {signals.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Summary (collapsible) */}
        {signals.thread_summary_detail && (
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <summary className="text-xs font-medium text-zinc-700 cursor-pointer">
              Detailed Summary
            </summary>
            <p className="mt-2 text-sm text-zinc-700">{signals.thread_summary_detail}</p>
          </details>
        )}

        {/* Primary Category */}
        {signals.primary_category && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Category</div>
            <div className="mt-1">
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {signals.primary_category}
              </span>
            </div>
          </div>
        )}

        {/* Secondary Categories */}
        {signals.secondary_categories && signals.secondary_categories.length > 0 && (
          <div>
            <div className="text-xs font-medium text-zinc-600">Secondary Categories</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {signals.secondary_categories.map((category, index) => (
                <span
                  key={index}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





