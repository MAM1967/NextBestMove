"use client";

import { useEffect, useState } from "react";
import { hasHighCompletionStreak } from "@/lib/plans/completion-tracking";
import { createClient } from "@/lib/supabase/client";

// Note: This component needs to be server-side compatible
// For now, we'll check on client-side, but ideally this should be checked server-side

export function CelebrationBanner() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkCelebration() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check if user has high completion streak
        const hasStreak = await hasHighCompletionStreak(supabase, user.id);
        setShowCelebration(hasStreak);
      } catch (error) {
        console.error("Error checking celebration:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkCelebration();
  }, []);

  if (isLoading || !showCelebration) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎉</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">You're on a roll!</h3>
          <p className="text-sm opacity-90">
            You've completed all actions for 7 days straight. Keep up the amazing work!
          </p>
        </div>
        <button
          onClick={() => setShowCelebration(false)}
          className="text-white hover:opacity-75 transition-opacity"
          aria-label="Dismiss celebration"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

