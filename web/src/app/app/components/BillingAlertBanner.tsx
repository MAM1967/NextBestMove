"use client";

import { useState } from "react";

type BillingAlertBannerProps = {
  status: "past_due" | "cancel_at_period_end";
  currentPeriodEnd: Date | null;
  onManageBilling?: () => Promise<void>;
};

export function BillingAlertBanner({
  status,
  currentPeriodEnd,
  onManageBilling,
}: BillingAlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleManageBilling = async () => {
    if (!onManageBilling) return;
    
    setIsLoading(true);
    try {
      await onManageBilling();
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "soon";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (status === "past_due") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Payment failed
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Update your payment method to keep your rhythm going. Your access
              will continue until we retry payment.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Opening..." : "Update Payment Method"}
            </button>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:text-amber-800 transition"
            aria-label="Dismiss banner"
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
        </div>
      </div>
    );
  }

  // cancel_at_period_end
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Subscription ending
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Your subscription is set to cancel on {formatDate(currentPeriodEnd)}.
            Reactivate anytime to keep your rhythm going.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={isLoading}
            className="inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Opening..." : "Reactivate Subscription"}
          </button>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-blue-600 hover:text-blue-800 transition"
          aria-label="Dismiss banner"
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
      </div>
    </div>
  );
}

