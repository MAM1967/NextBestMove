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
        const error = await response.json();
        throw new Error(error.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No billing portal URL returned");
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      // Fallback: redirect to settings page
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

