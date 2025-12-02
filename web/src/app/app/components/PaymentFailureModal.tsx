"use client";

import { useState, useEffect } from "react";

type PaymentFailureModalProps = {
  onManageBilling: () => Promise<void>;
  onDismiss: () => void;
};

export function PaymentFailureModal({
  onManageBilling,
  onDismiss,
}: PaymentFailureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Mark modal as shown in localStorage to prevent showing again
    const hasShown = localStorage.getItem("payment_failure_modal_shown");
    if (hasShown) {
      setIsDismissed(true);
    } else {
      localStorage.setItem("payment_failure_modal_shown", "true");
    }
  }, []);

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      await onManageBilling();
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div 
        className="relative w-full max-w-md rounded-xl border border-amber-200 bg-white p-6 shadow-xl"
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 transition z-10"
          aria-label="Close modal"
          type="button"
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

        <div className="mb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-zinc-900 mb-2 text-center">
          Payment Failed
        </h2>

        <p className="text-sm text-zinc-600 mb-6 text-center">
          Your payment failed 3 days ago. Update your payment method to restore
          full access and keep your rhythm going.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleManageBilling}
            disabled={isLoading}
            className="w-full rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isLoading ? "Opening..." : "Update Payment Method"}
          </button>

          <button
            onClick={handleDismiss}
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
          >
            Remind Me Later
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-4 text-center">
          Your data is safe. Update your payment method to restore full access.
        </p>
      </div>
    </div>
  );
}

