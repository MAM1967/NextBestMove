"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaywallOverlayProps = {
  subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled";
  isReadOnly?: boolean;
  trialEndsAt?: Date | null;
  onDismiss?: () => void;
};

export function PaywallOverlay({
  subscriptionStatus,
  isReadOnly = false,
  trialEndsAt,
  onDismiss,
}: PaywallOverlayProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "standard",
          interval: "month",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Unable to start checkout. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to open billing portal");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Unable to open billing portal. Please try again later.");
      setIsLoading(false);
    }
  };

  // Trial expired - read-only mode
  if (isReadOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Your trial has ended
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Subscribe to resume your rhythm. Your data is safe and nothing is
              lost.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Subscribe Now"}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Continue in Read-Only Mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Past due
  if (subscriptionStatus === "past_due") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Payment failed
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Update your payment method to keep your rhythm going.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Update Payment Method"}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Canceled or no subscription
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Subscribe to unlock this feature
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Start Free Trial"}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


