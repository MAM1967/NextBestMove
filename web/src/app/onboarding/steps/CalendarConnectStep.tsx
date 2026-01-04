"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CalendarConnectStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function CalendarConnectStep({
  onNext,
  onBack,
  onSkip,
}: CalendarConnectStepProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check URL params for calendar connection success
    const urlParams = new URLSearchParams(window.location.search);
    const calendarParam = urlParams.get("calendar");
    
    if (calendarParam === "success") {
      setIsConnected(true);
      setIsChecking(false);
      // Don't clean up URL here - let OnboardingFlow handle it
      return;
    }

    // Check if calendar is already connected
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/calendar/status");
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected === true);
        } else {
          // API error - log but don't block progression
          console.warn("Calendar status check failed:", response.status);
          // Default to not connected, allow user to continue
          setIsConnected(false);
        }
      } catch (error) {
        // Network or other errors - log but don't block progression
        console.error("Error checking calendar status:", error);
        // Default to not connected, allow user to continue
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = (provider: "google" | "outlook") => {
    try {
      // Redirect to calendar connect endpoint with callback to onboarding
      window.location.href = `/api/calendar/connect/${provider}?callbackUrl=/onboarding`;
    } catch (error) {
      // If redirect fails, log error but allow user to skip
      console.error("Error initiating calendar connection:", error);
      // User can still skip and continue
    }
  };

  // If already connected, show success and allow to continue
  if (isConnected && !isChecking) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Calendar Connected
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Your calendar is connected! Daily plans will adjust based on your
            schedule.
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm font-medium text-green-900">
              Calendar successfully connected
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Connect your calendar (optional, recommended)
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          I&apos;ll size your daily plan based on your schedule, so I
          don&apos;t overload you.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-zinc-700">
            Daily plans adjust to your available time
          </p>
        </div>
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-zinc-700">
            Respects busy days and reduces action count automatically
          </p>
        </div>
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-zinc-700">
            Defaults to 6 actions/day if not connected
          </p>
        </div>
      </div>

      {isChecking ? (
        <div className="text-center text-sm text-zinc-500">Checking...</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleConnect("google")}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Connect Google Calendar
          </button>
          <button
            type="button"
            onClick={() => handleConnect("outlook")}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Connect Outlook Calendar
          </button>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

