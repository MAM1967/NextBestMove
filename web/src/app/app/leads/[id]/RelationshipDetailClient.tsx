"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/leads/types";
import type { RelationshipSummary } from "@/lib/leads/summary-types";
import { NotesSummary } from "./NotesSummary";
import { RelationshipSignals } from "./RelationshipSignals";
import { EditLeadModal } from "../EditLeadModal";
import {
  computeRelationshipStatus,
  getStatusBadgeClasses,
  getStatusLabel,
  type RelationshipStatusInput,
} from "@/lib/leads/relationship-status";

interface RelationshipDetailClientProps {
  leadId: string;
  initialLead: Lead;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getUrlTypeLabel(url: string): string {
  if (url.startsWith("mailto:")) {
    return "Email";
  }
  if (url.includes("linkedin.com")) {
    return "LinkedIn";
  }
  if (url.startsWith("http")) {
    return "Link";
  }
  return "URL";
}

export function RelationshipDetailClient({
  leadId,
  initialLead,
}: RelationshipDetailClientProps) {
  const [lead, setLead] = useState<Lead>(initialLead);
  const [summary, setSummary] = useState<RelationshipSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/summary`);
        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }
        const data = await response.json();
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [leadId]);

  const handleLeadUpdate = async (
    leadId: string,
    leadData: {
      name: string;
      url: string;
      notes?: string;
      cadence?: string | null;
      cadence_days?: number | null;
      tier?: string | null;
    }
  ) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update relationship");
      }

      const { lead: updatedLead } = await response.json();
      setLead(updatedLead);
      setIsEditModalOpen(false);

      // Refetch summary to get updated data
      const summaryResponse = await fetch(`/api/leads/${leadId}/summary`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.summary);
      }
    } catch (err) {
      throw err;
    }
  };

  const relationshipStatusInput: RelationshipStatusInput = {
    cadence: lead.cadence ?? null,
    tier: lead.tier ?? null,
    last_interaction_at: lead.last_interaction_at ?? null,
    next_touch_due_at: lead.next_touch_due_at ?? null,
    cadence_days: lead.cadence_days ?? null,
  };
  const relationshipStatus = computeRelationshipStatus(relationshipStatusInput);
  const statusLabel = getStatusLabel(relationshipStatus);
  const statusBadgeClasses = getStatusBadgeClasses(relationshipStatus);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/app/leads"
            className="mb-4 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Relationships
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-zinc-900">{lead.name}</h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <a
                  href={lead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 hover:text-zinc-900 hover:underline"
                >
                  {getUrlTypeLabel(lead.url)}
                </a>
                <span>•</span>
                <span>Added {formatRelativeDate(lead.created_at)}</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Notes Summary Section */}
        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-zinc-600">Loading summary...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : summary ? (
          <NotesSummary summary={summary} />
        ) : null}

        {/* Email Signals */}
        <div className="mt-6">
          <RelationshipSignals relationshipId={lead.id} />
        </div>

        {/* Relationship Details */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            Relationship Details
          </h2>
          <div className="space-y-3">
            {lead.cadence && (
              <div>
                <span className="text-sm font-medium text-zinc-700">Cadence: </span>
                <span className="text-sm text-zinc-600">
                  {lead.cadence} {lead.cadence_days ? `(${lead.cadence_days} days)` : ""}
                </span>
              </div>
            )}
            {lead.tier && (
              <div>
                <span className="text-sm font-medium text-zinc-700">Tier: </span>
                <span className="text-sm text-zinc-600 capitalize">{lead.tier}</span>
              </div>
            )}
            {lead.preferred_channel && (
              <div>
                <span className="text-sm font-medium text-zinc-700">Preferred Channel: </span>
                <span className="text-sm text-zinc-600 capitalize">
                  {lead.preferred_channel === "linkedin"
                    ? "LinkedIn"
                    : lead.preferred_channel === "email"
                    ? "Email"
                    : lead.preferred_channel === "text"
                    ? "Text"
                    : "Other"}
                </span>
              </div>
            )}
            {lead.notes && (
              <div>
                <span className="text-sm font-medium text-zinc-700">Notes: </span>
                <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditLeadModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          lead={lead}
          onSave={handleLeadUpdate}
        />
      )}
    </div>
  );
}

