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
      // Server says to show modal - always show it if server says so
      // This ensures users see the modal if payment failure condition still exists
      console.log("PaymentFailureModal: Server says to show modal, opening...");
      setIsOpen(true);
    } else {
      // If server says not to show, clear localStorage flag so it can show again if condition returns
      localStorage.removeItem("payment_failure_modal_shown");
      setIsOpen(false);
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

