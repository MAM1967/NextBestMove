"use client";

import { useState, useEffect } from "react";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";

type ExtractionStatus = "pending" | "processing" | "completed" | "failed" | "needs_review";

interface MeetingNote {
  id: string;
  content: string;
  extracted_insights: string | null;
  extraction_status: ExtractionStatus;
  extraction_confidence: string | null;
  extracted_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface MeetingNotesProps {
  leadId: string;
  onNotesSaved?: () => void; // Callback to trigger NotesSummary refresh
}

export function MeetingNotes({ leadId, onNotesSaved }: MeetingNotesProps) {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchNotes();
    }
  }, [leadId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/meeting-notes`);
      if (!response.ok) {
        throw new Error("Failed to load meeting notes");
      }
      const data = await response.json();
      setNotes(data.meetingNotes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meeting notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/meeting-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save meeting notes");
      }

      const data = await response.json();
      // Add the new note to the list
      setNotes((prev) => [data.meetingNote, ...prev]);
      setNewNoteContent("");
      setShowAddForm(false);

      // Trigger NotesSummary refresh
      if (onNotesSaved) {
        onNotesSaved();
      }

      // Poll for extraction completion (with timeout)
      if (data.meetingNote.extraction_status === "processing") {
        pollForExtractionCompletion(data.meetingNote.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meeting notes");
    } finally {
      setSubmitting(false);
    }
  };

  const pollForExtractionCompletion = async (noteId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 30 seconds

    const poll = async () => {
      attempts++;
      try {
        const response = await fetch(`/api/leads/${leadId}/meeting-notes`);
        if (response.ok) {
          const data = await response.json();
          const updatedNote = data.meetingNotes?.find((n: MeetingNote) => n.id === noteId);
          if (updatedNote && updatedNote.extraction_status !== "processing") {
            // Update the note in the list
            setNotes((prev) =>
              prev.map((n) => (n.id === noteId ? updatedNote : n))
            );
            return;
          }
        }
      } catch (err) {
        console.error("Error polling for extraction:", err);
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 1000); // Poll every second
      }
    };

    setTimeout(poll, 1000);
  };

  const getStatusBadge = (status: string, confidence: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-zinc-100 text-zinc-700" },
      processing: { label: "Processing...", className: "bg-blue-100 text-blue-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      needs_review: { label: "Needs Review", className: "bg-yellow-100 text-yellow-700" },
      failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
        {confidence && status === "completed" && (
          <span className="ml-1 text-xs opacity-75">({confidence})</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Meeting Notes</h3>
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Meeting Notes</h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add Notes
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <label
            htmlFor="meeting-notes-content"
            className="block text-sm font-medium text-zinc-900"
          >
            Paste Meeting Notes or Transcript
          </label>
          <textarea
            id="meeting-notes-content"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={8}
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Paste your meeting notes or transcript here. We'll automatically extract action items and insights..."
            disabled={submitting}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Action items and insights will be automatically extracted from your notes.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewNoteContent("");
                setError(null);
              }}
              disabled={submitting}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newNoteContent.trim()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Extract & Save"}
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-sm text-zinc-500">
          {showAddForm
            ? null
            : "No meeting notes yet. Click 'Add Notes' to paste meeting notes or transcripts."}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-700">
                    {formatDateForDisplay(note.created_at)}
                  </span>
                  {getStatusBadge(note.extraction_status, note.extraction_confidence)}
                </div>
                {note.extracted_at && (
                  <span className="text-xs text-zinc-500">
                    Extracted {formatDateForDisplay(note.extracted_at)}
                  </span>
                )}
              </div>

              {note.extraction_status === "failed" && note.error_message && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  Error: {note.error_message}
                </div>
              )}

              {note.extraction_status === "needs_review" && (
                <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                  This extraction had low confidence. Please review the extracted items.
                </div>
              )}

              <div className="text-sm text-zinc-700 whitespace-pre-wrap">
                {note.content.length > 300
                  ? `${note.content.substring(0, 300)}...`
                  : note.content}
              </div>

              {note.extracted_insights && note.extraction_status === "completed" && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                  <h4 className="mb-2 text-xs font-semibold text-zinc-900">
                    Extracted Insights
                  </h4>
                  <div className="text-xs text-zinc-600">
                    {(() => {
                      try {
                        const insights = JSON.parse(note.extracted_insights);
                        if (Array.isArray(insights)) {
                          return (
                            <ul className="list-disc list-inside space-y-1">
                              {insights.map((insight: { text: string }, idx: number) => (
                                <li key={idx}>{insight.text}</li>
                              ))}
                            </ul>
                          );
                        }
                        return note.extracted_insights;
                      } catch {
                        return note.extracted_insights;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

