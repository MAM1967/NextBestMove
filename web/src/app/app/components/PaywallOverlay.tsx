"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSubscriptionStatus, checkGracePeriod } from "@/lib/billing/subscription-status";

type PaywallOverlayProps = {
  subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled";
  isReadOnly?: boolean;
  trialEndsAt?: string | null;
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

  // Convert "none" to null for getSubscriptionStatus
  const normalizedStatus = subscriptionStatus === "none" ? null : subscriptionStatus;
  
  // Analytics tracking
  useEffect(() => {
    const effectiveStatus = getSubscriptionStatus(normalizedStatus, trialEndsAt);
    console.log("[Paywall Analytics] Paywall viewed", {
      status: effectiveStatus,
      subscriptionStatus,
      trialEndsAt,
      isReadOnly,
      timestamp: new Date().toISOString(),
    });
  }, [subscriptionStatus, trialEndsAt, isReadOnly, normalizedStatus]);

  const handleSubscribe = async () => {
    const effectiveStatus = getSubscriptionStatus(normalizedStatus, trialEndsAt);
    console.log("[Paywall Analytics] Subscribe CTA clicked", {
      status: effectiveStatus,
      subscriptionStatus,
      trialEndsAt,
      timestamp: new Date().toISOString(),
    });

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

      console.log("[Paywall Analytics] Checkout session created", {
        status: effectiveStatus,
        timestamp: new Date().toISOString(),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      const effectiveStatus = getSubscriptionStatus(normalizedStatus, trialEndsAt);
      console.error("[Paywall Analytics] Checkout error", {
        error,
        status: effectiveStatus,
        timestamp: new Date().toISOString(),
      });
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

  // Check grace period status
  const { isInGracePeriod, daysUntilGracePeriodEnds } = checkGracePeriod(trialEndsAt);
  const effectiveStatus = getSubscriptionStatus(normalizedStatus, trialEndsAt);

  // Grace period - read-only mode (Day 15-21)
  if (effectiveStatus === "grace_period" || isReadOnly || isInGracePeriod) {
    const daysRemaining = daysUntilGracePeriodEnds ?? 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Your trial has ended
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {daysRemaining > 0
                ? `You have ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left to subscribe and keep your rhythm going. Your data is safe.`
                : "Subscribe to resume your rhythm. Your data is safe and nothing is lost."}
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

  // Past due - variant messaging
  if (subscriptionStatus === "past_due") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <div className="mb-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              Payment Failed
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Payment failed — Update to keep your streak alive
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Update your payment method to keep your rhythm going. Your data is safe.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                console.log("[Paywall Analytics] Update payment CTA clicked", {
                  status: "past_due",
                  timestamp: new Date().toISOString(),
                });
                handleManageBilling();
              }}
              disabled={isLoading}
              className="w-full rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Update Payment Method"}
            </button>
            {onDismiss && (
              <button
                onClick={() => {
                  console.log("[Paywall Analytics] Paywall dismissed", {
                    status: "past_due",
                    timestamp: new Date().toISOString(),
                  });
                  onDismiss();
                }}
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

  // Canceled or no subscription - variant messaging
  let headline = "Subscribe to unlock this feature";
  let description = "Start your 14-day free trial. No credit card required.";
  let ctaText = "Start Free Trial";
  
  if (effectiveStatus === "canceled") {
    headline = "Your plan is paused";
    description = "Reactivate anytime — your data stays safe. Subscribe to resume your rhythm.";
    ctaText = "Reactivate Subscription";
  } else if (normalizedStatus === "past_due") {
    // This should be handled above, but just in case
    headline = "Payment failed";
    description = "Update your payment method to keep your rhythm going.";
    ctaText = "Update Payment";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            {headline}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {description}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : ctaText}
          </button>
          {onDismiss && (
            <button
              onClick={() => {
                console.log("[Paywall Analytics] Paywall dismissed", {
                  status: effectiveStatus,
                  timestamp: new Date().toISOString(),
                });
                onDismiss();
              }}
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



