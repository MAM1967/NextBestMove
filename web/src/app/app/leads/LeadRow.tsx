"use client";

import Link from "next/link";
import type { Lead } from "@/lib/leads/types";
import { RelationshipStatusBadge } from "./RelationshipStatusBadge";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";

interface LeadRowProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onSnooze: (leadId: string) => void;
  onUnsnooze: (leadId: string) => void;
  onArchive: (leadId: string) => void;
  onRestore: (leadId: string) => void;
}

function getStatusBadgeVariant(status: Lead["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "SNOOZED":
      return "bg-orange-100 text-orange-800";
    case "ARCHIVED":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function getUrlTypeLabel(url: string | null | undefined): string {
  if (!url) return "Link";
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LeadRow({
  lead,
  onEdit,
  onSnooze,
  onUnsnooze,
  onArchive,
  onRestore,
}: LeadRowProps) {
  // Add test ID for the row
  const getActions = () => {
    if (lead.status === "ARCHIVED") {
      return (
        <>
          <button
            onClick={() => onEdit(lead)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            View/Edit
          </button>
          <button
            onClick={() => onRestore(lead.id)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Restore
          </button>
        </>
      );
    }

    if (lead.status === "SNOOZED") {
      return (
        <>
          <button
            onClick={() => onEdit(lead)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            View/Edit
          </button>
          <button
            onClick={() => onUnsnooze(lead.id)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Unsnooze
          </button>
          <button
            onClick={() => onArchive(lead.id)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Archive
          </button>
        </>
      );
    }

    return (
      <>
        <button
          onClick={() => onEdit(lead)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          View/Edit
        </button>
        <button
          onClick={() => onSnooze(lead.id)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Snooze
        </button>
        <button
          onClick={() => onArchive(lead.id)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Archive
        </button>
      </>
    );
  };

  return (
    <div
      data-testid={`relationship-row-${lead.id}`}
      className={`rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md ${
        lead.status === "ARCHIVED" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/app/leads/${lead.id}`}
              className="text-lg font-semibold text-zinc-900 hover:text-zinc-700 hover:underline"
            >
              {lead.name}
            </Link>
            <span
              data-testid={`relationship-status-${lead.id}`}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeVariant(
                lead.status
              )}`}
            >
              {lead.status === "SNOOZED" && lead.snooze_until
                ? `Snoozed until ${formatDate(lead.snooze_until)}`
                : lead.status}
            </span>
            {/* Relationship status badge (Needs attention / In rhythm / Intentional low-touch) */}
            {lead.status === "ACTIVE" && (
              <RelationshipStatusBadge
                cadence={lead.cadence || null}
                tier={lead.tier || null}
                last_interaction_at={lead.last_interaction_at || null}
                next_touch_due_at={lead.next_touch_due_at || null}
                cadence_days={lead.cadence_days || null}
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
            {(lead.linkedin_url || lead.email || lead.url) && (
              <a
                href={lead.linkedin_url || lead.email ? `mailto:${lead.email}` : (lead.url || undefined)}
                target={lead.linkedin_url || lead.url ? "_blank" : undefined}
                rel={lead.linkedin_url || lead.url ? "noopener noreferrer" : undefined}
                className="text-zinc-600 hover:text-zinc-900 hover:underline"
              >
                {lead.linkedin_url ? "LinkedIn" : lead.email ? "Email" : getUrlTypeLabel(lead.url)}
              </a>
            )}
            {(lead.linkedin_url || lead.email || lead.url) && <span>•</span>}
            <span>Added {formatRelativeDate(lead.created_at)}</span>
            {/* Show next touch due date if cadence is set */}
            {lead.next_touch_due_at && lead.status === "ACTIVE" && (
              <>
                <span>•</span>
                <span className="text-zinc-600">
                  Next touch: {formatDateForDisplay(lead.next_touch_due_at.split("T")[0])}
                </span>
              </>
            )}
            {/* Show last interaction if available */}
            {lead.last_interaction_at && (
              <>
                <span>•</span>
                <span className="text-zinc-500">
                  Last interaction: {formatRelativeDate(lead.last_interaction_at)}
                </span>
              </>
            )}
          </div>
          {lead.notes && (
            <p className="text-sm italic text-zinc-600">{lead.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1">{getActions()}</div>
      </div>
    </div>
  );
}

