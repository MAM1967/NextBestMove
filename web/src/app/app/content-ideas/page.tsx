"use client";

import { useState, useEffect } from "react";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";

type ContentPrompt = {
  id: string;
  type: "WIN_POST" | "INSIGHT_POST";
  content: string;
  status: "DRAFT" | "POSTED" | "ARCHIVED";
  saved_at: string;
  created_at: string;
};

type FilterType = "all" | "WIN_POST" | "INSIGHT_POST";
type FilterStatus = "all" | "DRAFT" | "POSTED" | "ARCHIVED";

export default function ContentIdeasPage() {
  const [prompts, setPrompts] = useState<ContentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<ContentPrompt | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [typeFilter, statusFilter]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/content-prompts?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch content prompts");
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load content prompts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (prompt: ContentPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleUpdateStatus = async (promptId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/content-prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }

      await fetchPrompts();
    } catch (err) {
      console.error("Error updating prompt:", err);
      alert(err instanceof Error ? err.message : "Failed to update prompt");
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this content prompt?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content-prompts/${promptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prompt");
      }

      await fetchPrompts();
    } catch (err) {
      console.error("Error deleting prompt:", err);
      alert(err instanceof Error ? err.message : "Failed to delete prompt");
    }
  };

  const handleEdit = (prompt: ContentPrompt) => {
    setEditingPrompt(prompt);
    setEditContent(prompt.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt || !editContent.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/content-prompts/${editingPrompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          user_edited: true, // Mark as edited for voice learning
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save edits");
      }

      setEditingPrompt(null);
      setEditContent("");
      await fetchPrompts();
    } catch (err) {
      console.error("Error saving edit:", err);
      alert(err instanceof Error ? err.message : "Failed to save edits");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setEditContent("");
  };

  const getTypeBadgeColor = (type: string) => {
    return type === "WIN_POST"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "POSTED":
        return "bg-green-100 text-green-800";
      case "ARCHIVED":
        return "bg-zinc-100 text-zinc-600";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    if (typeFilter !== "all" && prompt.type !== typeFilter) return false;
    if (statusFilter !== "all" && prompt.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-600">Loading content prompts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPrompts}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Ideas</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Saved prompts from your weekly summaries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="all">All Types</option>
            <option value="WIN_POST">Win Posts</option>
            <option value="INSIGHT_POST">Insight Posts</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-zinc-600">
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Prompts List */}
      {filteredPrompts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-600">No content prompts found.</p>
          <p className="mt-2 text-sm text-zinc-500">
            {prompts.length === 0
              ? "Save prompts from your weekly summaries to see them here."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTypeBadgeColor(
                      prompt.type
                    )}`}
                  >
                    {prompt.type === "WIN_POST" ? "Win Post" : "Insight Post"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(
                      prompt.status
                    )}`}
                  >
                    {prompt.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Saved {formatDateForDisplay(prompt.saved_at.split("T")[0])}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {prompt.content}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopy(prompt)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {copiedId === prompt.id ? "✓ Copied" : "Copy"}
                </button>

                <button
                  onClick={() => handleEdit(prompt)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Edit
                </button>

                {prompt.status === "DRAFT" && (
                  <button
                    onClick={() => handleUpdateStatus(prompt.id, "POSTED")}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Mark as Posted
                  </button>
                )}

                {prompt.status !== "ARCHIVED" && (
                  <button
                    onClick={() => handleUpdateStatus(prompt.id, "ARCHIVED")}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Archive
                  </button>
                )}

                {prompt.status === "ARCHIVED" && (
                  <button
                    onClick={() => handleUpdateStatus(prompt.id, "DRAFT")}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Unarchive
                  </button>
                )}

                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Edit Content Prompt
            </h2>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              rows={8}
              placeholder="Edit your content prompt..."
            />
            <p className="mt-2 text-xs text-zinc-500">
              Your edits will be used to improve future content generation.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

