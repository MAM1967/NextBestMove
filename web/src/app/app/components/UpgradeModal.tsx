"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: "pin_limit" | "premium_feature";
  featureName?: string; // e.g., "Pattern Detection", "Pre-Call Briefs"
  currentCount?: number; // For pin limit: current pin count
  limit?: number; // For pin limit: pin limit (50)
}

export function UpgradeModal({
  isOpen,
  onClose,
  trigger,
  featureName,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Create checkout session for Professional plan (monthly)
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "professional",
          interval: "month",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      if (data.url) {
        // Track upgrade trigger event
        // TODO: Add analytics tracking
        console.log("Upgrade triggered:", { trigger, featureName, currentCount, limit });
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start upgrade. Please try again.");
      setIsLoading(false);
    }
  };

  // Determine message based on trigger
  const getMessage = () => {
    if (trigger === "pin_limit") {
      return {
        title: "You've reached your pin limit",
        description: `You're currently using ${currentCount} of ${limit} pins on the Standard plan. Upgrade to Professional for unlimited pins and premium features.`,
        cta: "Upgrade to Professional",
      };
    } else if (trigger === "premium_feature") {
      return {
        title: `${featureName || "This feature"} is available on Professional`,
        description: `Upgrade to Professional to unlock ${featureName || "this feature"} and more premium capabilities.`,
        cta: "Upgrade to Professional",
      };
    }
    return {
      title: "Upgrade to Professional",
      description: "Unlock unlimited pins and premium features.",
      cta: "Upgrade to Professional",
    };
  };

  const message = getMessage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          disabled={isLoading}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
          <svg
            className="h-6 w-6 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-zinc-900">
            {message.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">{message.description}</p>
        </div>

        {/* Professional Plan Benefits */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Professional includes:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
            <li className="flex items-start">
              <svg
                className="mr-2 h-4 w-4 flex-shrink-0 text-green-500"
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
              Unlimited pins
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 h-4 w-4 flex-shrink-0 text-green-500"
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
              Pattern detection
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 h-4 w-4 flex-shrink-0 text-green-500"
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
              Pre-call briefs
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 h-4 w-4 flex-shrink-0 text-green-500"
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
              Performance timeline
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 h-4 w-4 flex-shrink-0 text-green-500"
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
              Content engine
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="mt-4 text-center">
          <p className="text-sm text-zinc-600">
            <span className="text-2xl font-bold text-zinc-900">$79</span>
            <span className="text-zinc-600">/month</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="rounded-full bg-purple-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? "Loading..." : message.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

