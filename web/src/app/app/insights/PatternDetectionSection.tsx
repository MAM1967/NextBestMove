"use client";

import { useEffect, useState } from "react";
import type { UserPattern } from "@/lib/patterns/types";
import { UpgradeModal } from "../components/UpgradeModal";

interface ApiResponse {
  success?: boolean;
  patterns?: UserPattern[];
  message?: string;
  error?: string;
  code?: string;
}

function PatternCard({ pattern }: { pattern: UserPattern }) {
  const title = getPatternTitle(pattern.type);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-700">{pattern.insight}</p>
      <div className="mt-2 text-xs text-zinc-500">
        Confidence: {Math.round(pattern.confidence * 100)}%
      </div>
    </div>
  );
}

function getPatternTitle(type: UserPattern["type"]): string {
  switch (type) {
    case "day_of_week_performance":
      return "Best Days for Outreach";
    case "follow_up_timing":
      return "Follow-Up Timing";
    case "action_type_conversion":
      return "What Works Best";
    case "warm_reengagement":
      return "Warm Re-Engagement";
    default:
      return "Pattern";
  }
}

export function PatternDetectionSection() {
  const [patterns, setPatterns] = useState<UserPattern[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function loadPatterns() {
      try {
        const res = await fetch("/api/patterns");
        const data: ApiResponse = await res.json();

        if (!res.ok) {
          if (data.code === "UPGRADE_REQUIRED") {
            setError(
              "Pattern detection is a Premium feature. Upgrade to unlock deeper insights about your outreach."
            );
            setShowUpgradeModal(true);
          } else {
            setError(
              data.error || "Unable to load insights. Please try again later."
            );
          }
          return;
        }

        setPatterns(data.patterns || []);
        if (data.message) {
          setMessage(data.message);
        }
      } catch (err) {
        console.error("Failed to load patterns", err);
        setError("Unable to load insights. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadPatterns();
  }, []);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Pattern Detection
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Discover patterns in your outreach to lean into what&apos;s working
          </p>
        </div>

        {loading && (
          <p className="text-sm text-zinc-600">Loading your patterns...</p>
        )}

        {!loading && error && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!loading && !error && message && (
          <p className="text-sm text-zinc-600">{message}</p>
        )}

        {!loading && !error && patterns && patterns.length > 0 && (
          <div className="mt-4 space-y-3">
            {patterns.map((pattern, idx) => (
              <PatternCard key={idx} pattern={pattern} />
            ))}
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger="premium_feature"
          featureName="Pattern Detection"
        />
      )}
    </>
  );
}

