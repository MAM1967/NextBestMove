"use client";

import { useState, useEffect } from "react";
import { PaymentFailureModal } from "./PaymentFailureModal";

type PaymentFailureModalClientProps = {
  showModal: boolean;
};

export function PaymentFailureModalClient({
  showModal,
}: PaymentFailureModalClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (showModal) {
      // Check if modal was already dismissed
      const hasShown = localStorage.getItem("payment_failure_modal_shown");
      if (!hasShown) {
        setIsOpen(true);
      }
    }
  }, [showModal]);

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

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("payment_failure_modal_shown", "true");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <PaymentFailureModal
      onManageBilling={handleManageBilling}
      onDismiss={handleDismiss}
    />
  );
}

