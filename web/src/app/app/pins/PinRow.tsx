"use client";

import type { Lead } from "@/lib/leads/types";

interface PinRowProps {
  pin: Lead;
  onEdit: (pin: Lead) => void;
  onSnooze: (pinId: string) => void;
  onUnsnooze: (pinId: string) => void;
  onArchive: (pinId: string) => void;
  onRestore: (pinId: string) => void;
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

export function PinRow({
  pin,
  onEdit,
  onSnooze,
  onUnsnooze,
  onArchive,
  onRestore,
}: PinRowProps) {
  const getActions = () => {
    if (pin.status === "ARCHIVED") {
      return (
        <>
          <button
            onClick={() => onEdit(pin)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            View/Edit
          </button>
          <button
            onClick={() => onRestore(pin.id)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Restore
          </button>
        </>
      );
    }

    if (pin.status === "SNOOZED") {
      return (
        <>
          <button
            onClick={() => onEdit(pin)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            View/Edit
          </button>
          <button
            onClick={() => onUnsnooze(pin.id)}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Unsnooze
          </button>
          <button
            onClick={() => onArchive(pin.id)}
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
          onClick={() => onEdit(pin)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          View/Edit
        </button>
        <button
          onClick={() => onSnooze(pin.id)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Snooze
        </button>
        <button
          onClick={() => onArchive(pin.id)}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Archive
        </button>
      </>
    );
  };

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md ${
        pin.status === "ARCHIVED" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-zinc-900">{pin.name}</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeVariant(
                pin.status
              )}`}
            >
              {pin.status === "SNOOZED" && pin.snooze_until
                ? `Snoozed until ${formatDate(pin.snooze_until)}`
                : pin.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <a
              href={pin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 hover:underline"
            >
              {getUrlTypeLabel(pin.url)}
            </a>
            <span>•</span>
            <span>Added {formatRelativeDate(pin.created_at)}</span>
          </div>
          {pin.notes && (
            <p className="text-sm italic text-zinc-600">{pin.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1">{getActions()}</div>
      </div>
    </div>
  );
}

