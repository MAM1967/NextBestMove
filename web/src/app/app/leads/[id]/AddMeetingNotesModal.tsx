"use client";

import { useState, useRef } from "react";
import type { PreferredChannel } from "@/lib/leads/types";

interface AddMeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipId: string;
  relationshipName: string;
  onSuccess?: () => void;
}

interface ExtractionResult {
  action_items: Array<{
    description: string;
    action_type: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    confidence: number;
  }>;
  insights: Array<{
    text: string;
    type: "deadline" | "opportunity" | "risk" | "other";
    confidence: number;
  }>;
  open_loops: Array<{
    text: string;
    confidence: number;
  }>;
  extraction_metadata: {
    confidence: number;
    items_extracted: number;
    model: string;
    extracted_at: string;
  };
}

export function AddMeetingNotesModal({
  isOpen,
  onClose,
  relationshipId,
  relationshipName,
  onSuccess,
}: AddMeetingNotesModalProps) {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [notesText, setNotesText] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["text/plain", "text/markdown"];
    const validExtensions = [".txt", ".md"];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType =
      validTypes.includes(selectedFile.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidType) {
      setError("Please upload a .txt or .md file");
      return;
    }

    // Validate file size (1MB limit)
    if (selectedFile.size > 1024 * 1024) {
      setError("File size must be less than 1MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Read file content
    try {
      const text = await selectedFile.text();
      setFileContent(text);
      setNotesText(text);
    } catch (err) {
      setError("Failed to read file. Please try again.");
      console.error("File read error:", err);
    }
  };

  const handleExtract = async () => {
    const content = notesText.trim();
    if (!content) {
      setError("Please enter or upload meeting notes");
      return;
    }

    if (content.length < 50) {
      setError("Meeting notes must be at least 50 characters");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractionResult(null);

    try {
      const response = await fetch("/api/meeting-notes/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relationship_id: relationshipId,
          content,
          meeting_date: meetingDate || null,
          source: tab === "upload" ? "upload" : "paste",
          file_name: file?.name || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract actions and insights");
      }

      const data = await response.json();
      setExtractionResult(data.extraction);
    } catch (err) {
      console.error("Extraction error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to extract. Please try again."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApproveSelected = async () => {
    if (!extractionResult) return;

    // Filter items by confidence and user selection
    // For now, we'll just send all items and let backend handle confidence thresholds
    try {
      const response = await fetch("/api/meeting-notes/create-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relationship_id: relationshipId,
          extraction_result: extractionResult,
          meeting_date: meetingDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create actions and insights");
      }

      onSuccess?.();
      onClose();
      // Reset form
      setNotesText("");
      setFile(null);
      setFileContent("");
      setExtractionResult(null);
      setError(null);
    } catch (err) {
      console.error("Create items error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create items. Please try again."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">
              Add Meeting Notes
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{relationshipName}</p>
        </div>

        <div className="p-6">
          {!extractionResult ? (
            <>
              {/* Tabs */}
              <div className="mb-4 flex gap-2 border-b border-zinc-200">
                <button
                  onClick={() => setTab("paste")}
                  className={`px-4 py-2 text-sm font-medium ${
                    tab === "paste"
                      ? "border-b-2 border-zinc-900 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setTab("upload")}
                  className={`px-4 py-2 text-sm font-medium ${
                    tab === "upload"
                      ? "border-b-2 border-zinc-900 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Upload File
                </button>
              </div>

              {/* Meeting Date */}
              <div className="mb-4">
                <label
                  htmlFor="meeting-date"
                  className="block text-sm font-medium text-zinc-900"
                >
                  Meeting Date (optional)
                </label>
                <input
                  type="date"
                  id="meeting-date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              {/* Paste Tab */}
              {tab === "paste" && (
                <div className="mb-4">
                  <label
                    htmlFor="notes-text"
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Meeting Notes
                  </label>
                  <textarea
                    id="notes-text"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    rows={12}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    placeholder="Paste your meeting notes or transcript here..."
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    {notesText.length} characters
                  </p>
                </div>
              )}

              {/* Upload Tab */}
              {tab === "upload" && (
                <div className="mb-4">
                  <label
                    htmlFor="file-upload"
                    className="block text-sm font-medium text-zinc-900"
                  >
                    Upload File (.txt or .md)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    accept=".txt,.md"
                    onChange={handleFileSelect}
                    className="mt-1 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                  {file && (
                    <p className="mt-2 text-sm text-zinc-600">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  {fileContent && (
                    <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                      <p className="mb-2 text-xs font-medium text-zinc-700">
                        Preview:
                      </p>
                      <p className="max-h-40 overflow-y-auto text-xs text-zinc-600 whitespace-pre-wrap">
                        {fileContent.substring(0, 500)}
                        {fileContent.length > 500 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtract}
                  disabled={isExtracting || !notesText.trim()}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? "Extracting..." : "Extract Actions & Insights"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Extraction Results */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Extraction Results
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Overall confidence:{" "}
                  {(extractionResult.extraction_metadata.confidence * 100).toFixed(0)}%
                  ({extractionResult.extraction_metadata.items_extracted} items extracted)
                </p>
              </div>

              {/* Action Items */}
              {extractionResult.action_items.length > 0 && (
                <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
                  <h4 className="mb-2 text-sm font-semibold text-zinc-900">
                    Action Items ({extractionResult.action_items.length})
                  </h4>
                  <ul className="space-y-2">
                    {extractionResult.action_items.map((item, idx) => (
                      <li
                        key={idx}
                        className={`rounded-md border p-3 ${
                          item.confidence >= 0.8
                            ? "border-green-200 bg-green-50"
                            : item.confidence >= 0.6
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-900">
                              {item.description}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              Type: {item.action_type} | Priority: {item.priority} | Due:{" "}
                              {item.due_date || "Not specified"}
                            </p>
                          </div>
                          <span
                            className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.confidence >= 0.8
                                ? "bg-green-100 text-green-800"
                                : item.confidence >= 0.6
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insights */}
              {extractionResult.insights.length > 0 && (
                <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
                  <h4 className="mb-2 text-sm font-semibold text-zinc-900">
                    Insights ({extractionResult.insights.length})
                  </h4>
                  <ul className="space-y-2">
                    {extractionResult.insights.map((insight, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-blue-200 bg-blue-50 p-3"
                      >
                        <p className="text-sm text-zinc-900">{insight.text}</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Type: {insight.type} | Confidence:{" "}
                          {(insight.confidence * 100).toFixed(0)}%
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Open Loops */}
              {extractionResult.open_loops.length > 0 && (
                <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
                  <h4 className="mb-2 text-sm font-semibold text-zinc-900">
                    Open Loops ({extractionResult.open_loops.length})
                  </h4>
                  <ul className="space-y-2">
                    {extractionResult.open_loops.map((loop, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-orange-200 bg-orange-50 p-3"
                      >
                        <p className="text-sm text-zinc-900">{loop.text}</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Confidence: {(loop.confidence * 100).toFixed(0)}%
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setExtractionResult(null);
                    setError(null);
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  onClick={handleApproveSelected}
                  disabled={!!error}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Actions & Insights
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}






