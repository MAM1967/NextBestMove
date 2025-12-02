"use client";

import { BillingAlertBanner } from "./BillingAlertBanner";

type BillingAlertBannerClientProps = {
  status: "past_due" | "cancel_at_period_end";
  currentPeriodEnd: Date | null;
};

export function BillingAlertBannerClient({
  status,
  currentPeriodEnd,
}: BillingAlertBannerClientProps) {
  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: Failed to open billing portal`;
        console.error("Failed to open billing portal:", {
          status: response.status,
          error: errorMessage,
          errorData,
        });
        // Show error to user instead of silently redirecting
        alert(`Unable to open billing portal: ${errorMessage}. Please try again or go to Settings to manage billing.`);
        // Still redirect to settings as fallback, but user knows why
        window.location.href = "/app/settings";
        return;
      }

      const { url } = await response.json();
      if (url) {
        // Redirect directly to Stripe billing portal
        window.location.href = url;
      } else {
        throw new Error("No billing portal URL returned");
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Show error to user instead of silently redirecting
      alert(`Unable to open billing portal: ${errorMessage}. Please try again or go to Settings to manage billing.`);
      // Redirect to settings as fallback
      window.location.href = "/app/settings";
    }
  };

  return (
    <BillingAlertBanner
      status={status}
      currentPeriodEnd={currentPeriodEnd}
      onManageBilling={handleManageBilling}
    />
  );
}

