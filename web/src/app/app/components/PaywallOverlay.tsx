"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSubscriptionStatus,
  checkGracePeriod,
} from "@/lib/billing/subscription-status";
import { useUserTier } from "@/lib/billing/use-user-tier";
import { getTierInfo } from "@/lib/billing/tier-labels";

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
  const { tier } = useUserTier();

  // Convert "none" to null for getSubscriptionStatus
  const normalizedStatus =
    subscriptionStatus === "none" ? null : subscriptionStatus;

  // Analytics tracking
  useEffect(() => {
    const effectiveStatus = getSubscriptionStatus(
      normalizedStatus,
      trialEndsAt
    );
    console.log("[Paywall Analytics] Paywall viewed", {
      status: effectiveStatus,
      subscriptionStatus,
      trialEndsAt,
      isReadOnly,
      timestamp: new Date().toISOString(),
    });
  }, [subscriptionStatus, trialEndsAt, isReadOnly, normalizedStatus]);

  const handleSubscribe = async () => {
    const effectiveStatus = getSubscriptionStatus(
      normalizedStatus,
      trialEndsAt
    );
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
      const effectiveStatus = getSubscriptionStatus(
        normalizedStatus,
        trialEndsAt
      );
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Error opening billing portal:", {
          status: response.status,
          error: errorData.error || "Failed to open billing portal",
          details: errorData.details,
        });
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No portal URL returned");
      }
      window.location.href = url;
    } catch (error) {
      const effectiveStatus = getSubscriptionStatus(
        normalizedStatus,
        trialEndsAt
      );
      console.error("[Paywall Analytics] Billing portal error", {
        error,
        status: effectiveStatus,
        timestamp: new Date().toISOString(),
      });
      alert("Unable to open billing portal. Please try again later.");
      setIsLoading(false);
    }
  };

  // Check grace period status
  const { isInGracePeriod, daysUntilGracePeriodEnds } =
    checkGracePeriod(trialEndsAt);
  const effectiveStatus = getSubscriptionStatus(normalizedStatus, trialEndsAt);

  // Debug logging for canceled status
  if (normalizedStatus === "canceled" || effectiveStatus === "canceled") {
    console.log("[Paywall Debug] Canceled status check", {
      subscriptionStatus: normalizedStatus,
      effectiveStatus,
      trialEndsAt,
      isInGracePeriod,
      daysUntilGracePeriodEnds,
    });
  }

  // Past due - show payment failure message FIRST (even if in read-only mode)
  // This ensures payment failure read-only mode (Day 7-14) shows correct message
  if (subscriptionStatus === "past_due") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <div className="mb-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              Payment Failed
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">
              {isReadOnly 
                ? "Payment failed — Account is read-only"
                : "Payment failed — Update to maintain your activity"}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {isReadOnly
                ? "Your account is in read-only mode. Update your payment method to restore full access. Your data is safe."
                : "Update your payment method to keep your rhythm going. Your data is safe."}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                console.log("[Paywall Analytics] Update payment CTA clicked", {
                  status: "past_due",
                  isReadOnly,
                  timestamp: new Date().toISOString(),
                });
                handleManageBilling();
              }}
              disabled={isLoading}
              className="w-full rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Update Payment Method"}
            </button>
            {onDismiss && !isReadOnly && (
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

  // Grace period - read-only mode (Day 15-21) - only for trial expiration, not payment failure
  // Note: past_due is already handled above, so this only applies to trial expiration
  // isReadOnly can be true for trial grace period, so check that status is not canceled
  if (effectiveStatus === "grace_period" || (isReadOnly && subscriptionStatus !== "canceled") || isInGracePeriod) {
    const daysRemaining = daysUntilGracePeriodEnds ?? 0;
    const tierInfo = tier ? getTierInfo(tier) : null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="paywall-overlay">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Your Standard trial has ended
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {tier === "free" ? (
                <>
                  You're now on <strong>Free - Memory Relief</strong>. Upgrade to <strong>Standard - Decision Automation</strong> to keep automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries.
                </>
              ) : daysRemaining > 0 ? (
                `You have ${daysRemaining} day${
                  daysRemaining !== 1 ? "s" : ""
                } left to subscribe and keep your rhythm going. Your data is safe.`
              ) : (
                "Subscribe to resume your rhythm. Your data is safe and nothing is lost."
              )}
            </p>
          </div>

          <div className="space-y-3">
            <button
              data-testid="upgrade-button"
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


  // Canceled or no subscription - variant messaging
  const tierInfo = tier ? getTierInfo(tier) : null;
  let headline = tier === "free" 
    ? "Upgrade to unlock this feature"
    : "Subscribe to unlock this feature";
  let description = tier === "free"
    ? `You're on Free - Memory Relief. Upgrade to Standard - Decision Automation for automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries.`
    : "Start your 14-day Standard trial. No credit card required.";
  let ctaText = tier === "free"
    ? "Upgrade to Standard"
    : "Start Standard Trial";

  if (effectiveStatus === "canceled") {
    headline = "Your plan is paused";
    description =
      "Reactivate anytime — your data stays safe. Subscribe to resume your rhythm.";
    ctaText = "Reactivate Subscription";
  } else if (normalizedStatus === "past_due") {
    // This should be handled above, but just in case
    headline = "Payment failed";
    description = "Update your payment method to keep your rhythm going.";
    ctaText = "Update Payment";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="paywall-overlay">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">{headline}</h2>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>

        <div className="space-y-3">
          <button
            data-testid="upgrade-button"
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
