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

export function VoiceLearningSection({ isPremium }: VoiceLearningSectionProps) {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [availableSamples, setAvailableSamples] = useState(0);
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isPremium) {
      fetchVoiceProfile();
    } else {
      setIsLoading(false);
    }
  }, [isPremium]);

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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(data.message || "Insufficient samples");
        }
        throw new Error(data.error || "Failed to analyze voice");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze voice");
    } finally {
      setIsAnalyzing(false);
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
              <span className="font-medium">{availableSamples}</span> text sample{availableSamples !== 1 ? "s" : ""} available
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing..." : profile ? "Regenerate Profile" : "Create Profile"}
            </button>
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

