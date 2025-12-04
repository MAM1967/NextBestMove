"use client";

import { useState, useEffect } from "react";
import { VoiceProfileCard } from "./VoiceProfileCard";

type VoiceLearningSectionProps = {
  isPremium: boolean;
};

interface VoiceProfile {
  characteristics: {
    tone: string;
    formality: string;
    sentence_length: string;
    vocabulary_level: string;
    common_phrases: string[];
    writing_patterns?: {
      greeting_style?: string;
      closing_style?: string;
      punctuation_preference?: string;
    };
    topics?: string[];
    sample_texts?: string[];
  };
  sampleCount: number;
  lastUpdated: string;
}

interface ManualSample {
  id: string;
  sample_type: "email" | "linkedin_post" | "other";
  content: string;
  created_at: string;
}

export function VoiceLearningSection({ isPremium }: VoiceLearningSectionProps) {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [availableSamples, setAvailableSamples] = useState(0);
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [manualSamples, setManualSamples] = useState<ManualSample[]>([]);
  const [showAddSample, setShowAddSample] = useState(false);
  const [newSampleType, setNewSampleType] = useState<"email" | "linkedin_post" | "other">("email");
  const [newSampleContent, setNewSampleContent] = useState("");
  const [isAddingSample, setIsAddingSample] = useState(false);

  useEffect(() => {
    if (isPremium) {
      fetchVoiceProfile();
      fetchManualSamples();
    } else {
      setIsLoading(false);
    }
  }, [isPremium]);

  const fetchManualSamples = async () => {
    try {
      const response = await fetch("/api/voice-profile/samples");
      if (!response.ok) {
        if (response.status === 402) {
          return;
        }
        throw new Error("Failed to fetch manual samples");
      }

      const data = await response.json();
      setManualSamples(data.samples || []);
    } catch (err) {
      console.error("Error fetching manual samples:", err);
    }
  };

  const fetchVoiceProfile = async () => {
    try {
      const response = await fetch("/api/voice-profile/analyze");
      if (!response.ok) {
        if (response.status === 402) {
          // Not Premium - handled by parent
          return;
        }
        throw new Error("Failed to fetch voice profile");
      }

      const data = await response.json();
      setProfile(data.profile);
      setAvailableSamples(data.availableSamples);
      setCanAnalyze(data.canAnalyze);
    } catch (err) {
      console.error("Error fetching voice profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load voice profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/voice-profile/analyze", {
        method: "POST",
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        throw new Error(`Server error: ${text || response.statusText}`);
      }

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(data.message || data.error || "Insufficient samples");
        }
        if (response.status === 402) {
          throw new Error("Upgrade to Premium required");
        }
        throw new Error(data.error || data.details || `Failed to analyze voice (${response.status})`);
      }

      setProfile({
        characteristics: data.characteristics,
        sampleCount: data.sampleCount,
        lastUpdated: new Date().toISOString(),
      });
      setAvailableSamples(data.sampleCount);
      setCanAnalyze(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Refresh sample count
      await fetchVoiceProfile();
    } catch (err) {
      console.error("Voice analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze voice");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSample = async () => {
    if (!newSampleContent.trim() || newSampleContent.trim().length < 50) {
      setError("Sample must be at least 50 characters");
      return;
    }

    setIsAddingSample(true);
    setError(null);

    try {
      const response = await fetch("/api/voice-profile/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_type: newSampleType,
          content: newSampleContent.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add sample");
      }

      setNewSampleContent("");
      setShowAddSample(false);
      await fetchManualSamples();
      await fetchVoiceProfile(); // Refresh count
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sample");
    } finally {
      setIsAddingSample(false);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    try {
      const response = await fetch(`/api/voice-profile/samples/${sampleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sample");
      }

      await fetchManualSamples();
      await fetchVoiceProfile(); // Refresh count
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sample");
    }
  };

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No portal URL returned");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Unable to open billing portal. Please try again later.");
      setIsUpgrading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-zinc-900">Voice Learning</p>
              <p className="text-xs text-zinc-600">
                AI learns your writing style to generate content that sounds like you.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              Premium feature
            </span>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrading ? "Loading..." : "Upgrade to Premium"}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <p className="text-sm text-zinc-600">Loading voice profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <div className="mb-3 space-y-1">
          <p className="text-sm font-medium text-zinc-900">Voice Learning</p>
          <p className="text-xs text-zinc-600">
            AI analyzes your writing style from edited content prompts, action notes, and pin notes to generate content that matches your voice.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-800">
            Voice profile updated successfully!
          </div>
        )}

        <div className="space-y-3">
          {profile ? (
            <VoiceProfileCard profile={profile} />
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-700 mb-1">
                No voice profile yet
              </p>
              <p className="text-xs text-zinc-600 mb-3">
                {availableSamples < 5
                  ? `You need ${5 - availableSamples} more text sample${5 - availableSamples !== 1 ? "s" : ""} to create a voice profile. Edit content prompts or add notes to actions/pins.`
                  : "Click below to analyze your writing style."}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-600">
              <span className="font-medium">{availableSamples}</span> usable text sample{availableSamples !== 1 ? "s" : ""} available (≥50 characters each)
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing..." : profile ? "Regenerate Profile" : "Create Profile"}
            </button>
          </div>

          {/* Manual Samples Section */}
          <div className="border-t border-zinc-200 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-900">Add Your Own Samples</p>
                <p className="text-xs text-zinc-600">
                  Add sample emails or LinkedIn posts to improve voice accuracy
                </p>
              </div>
              {!showAddSample && (
                <button
                  onClick={() => setShowAddSample(true)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Add Sample
                </button>
              )}
            </div>

            {showAddSample && (
              <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Sample Type
                  </label>
                  <select
                    value={newSampleType}
                    onChange={(e) => setNewSampleType(e.target.value as "email" | "linkedin_post" | "other")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin_post">LinkedIn Post</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Content (minimum 50 characters)
                  </label>
                  <textarea
                    value={newSampleContent}
                    onChange={(e) => setNewSampleContent(e.target.value)}
                    placeholder="Paste your email, LinkedIn post, or other professional writing sample here..."
                    rows={6}
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    {newSampleContent.length} characters (minimum 50)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSample}
                    disabled={isAddingSample || newSampleContent.trim().length < 50}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingSample ? "Adding..." : "Add Sample"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSample(false);
                      setNewSampleContent("");
                      setError(null);
                    }}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {manualSamples.length > 0 && (
              <div className="space-y-2">
                {manualSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-start justify-between rounded-lg border border-zinc-200 bg-white p-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
                          {sample.sample_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(sample.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 line-clamp-2">
                        {sample.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSample(sample.id)}
                      className="ml-2 rounded-md p-1 text-zinc-400 hover:text-red-600"
                      title="Delete sample"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>Privacy:</strong> Your writing samples are used only to improve content generation. They are stored securely and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

