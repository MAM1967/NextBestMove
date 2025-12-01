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

