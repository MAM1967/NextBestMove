"use client";

import { useState } from "react";
import { PlanSelectionModal } from "./PlanSelectionModal";
import type { PlanType, IntervalType } from "@/lib/billing/stripe";

type Subscription = {
  id: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata: {
    plan_name?: string;
    amount?: number;
  } | null;
};

type BillingSectionProps = {
  subscription: Subscription | null;
  hasCustomer: boolean;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    trialing: "bg-blue-100 text-blue-700 border-blue-200",
    active: "bg-green-100 text-green-700 border-green-200",
    past_due: "bg-amber-100 text-amber-700 border-amber-200",
    canceled: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    trialing: "Trial",
    active: "Active",
    past_due: "Past Due",
    canceled: "Canceled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function BillingSection({
  subscription,
  hasCustomer,
}: BillingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  // Handle modal close - ensure state is reset
  // Button visibility is based on subscription status, not modal state
  function handleCloseModal() {
    setShowPlanSelection(false);
    setIsLoading(false); // Reset loading state in case of errors
    // Note: Button visibility is controlled by !hasCustomer && !subscription
    // Modal state (showPlanSelection) only controls modal visibility, not button visibility
  }

  async function handleManageBilling() {
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
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubscribe(plan: PlanType, interval: IntervalType) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval,
          isTrial: true, // Start with 14-day trial
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        let errorText = "";
        try {
          errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Response is not JSON, use the text
          errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        const errorMessage = errorData.details || errorData.error || errorData.message || `HTTP ${response.status}: Failed to create checkout session`;
        console.error("Checkout error:", {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorData,
          rawResponse: errorText
        });
        alert(`Unable to start checkout: ${errorMessage}`);
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No checkout URL returned");
      }
      window.location.href = url;
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      alert(`Unable to start checkout: ${error.message || "Please try again later."}`);
      setIsLoading(false);
    }
  }

  function handleSelectPlan(plan: PlanType, interval: IntervalType) {
    setShowPlanSelection(false);
    handleSubscribe(plan, interval);
  }

  // Handle checkout errors - ensure modal can be reopened
  // This is called when handleSubscribe fails
  // The error handling in handleSubscribe already sets isLoading to false
  // But we need to ensure the modal can be reopened

  async function handleSyncSubscription() {
    setIsLoading(true);
    try {
      console.log("Starting subscription sync...");
      const response = await fetch("/api/billing/sync-subscription", {
        method: "POST",
      });

      const responseText = await response.text();
      console.log("Sync response status:", response.status);
      console.log("Sync response:", responseText);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText || "Failed to sync subscription" };
        }
        throw new Error(errorData.error || errorData.details || "Failed to sync subscription");
      }

      const data = JSON.parse(responseText);
      console.log("Sync successful:", data);
      
      // Small delay to ensure database write completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page to show updated subscription
      window.location.reload();
    } catch (error: any) {
      console.error("Error syncing subscription:", error);
      alert(`Unable to sync subscription: ${error.message || "Please try again later."}`);
      setIsLoading(false);
    }
  }

  // Button visibility is based on subscription status, NOT modal state or customer existence
  // This ensures the button always reappears after canceling the modal or hitting back from Stripe
  // Edge case: If user hits back from Stripe checkout, hasCustomer might be true but no subscription exists
  // In that case, we should still show "Start Free Trial", not "Sync Subscription"
  if (!subscription) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm font-medium text-zinc-900">No active subscription</p>
        <p className="mt-1 text-xs text-zinc-600">
          {hasCustomer 
            ? "Your subscription may have expired or been canceled."
            : "Start your 14-day free trial. No credit card required."
          }
        </p>
        {/* Always show "Start Free Trial" when no subscription exists, regardless of hasCustomer */}
        {/* This handles the edge case where user hits back from Stripe checkout */}
        <button
          type="button"
          onClick={() => setShowPlanSelection(true)}
          disabled={isLoading}
          className="mt-4 inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Start Free Trial"}
        </button>
        <PlanSelectionModal
          isOpen={showPlanSelection}
          onClose={handleCloseModal}
          onSelectPlan={handleSelectPlan}
          isLoading={isLoading}
        />
      </div>
    );
  }

  const renewalDate = new Date(subscription.current_period_end);
  const isCanceled = subscription.status === "canceled";
  const isCanceling = subscription.cancel_at_period_end && !isCanceled;
  const planName =
    subscription.metadata?.plan_name || "Solo Plan"; // Default fallback

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">Plan</p>
              <p className="mt-0.5 text-xs text-zinc-600">{planName}</p>
            </div>
            <StatusBadge status={subscription.status} />
          </div>

          {subscription.metadata?.amount && (
            <div>
              <p className="text-sm font-medium text-zinc-900">
                ${(subscription.metadata.amount / 100).toFixed(2)}/month
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500">Renewal date</p>
            <p className="text-sm font-medium text-zinc-900">
              {renewalDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {isCanceling && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-900">
                Subscription will cancel on{" "}
                {renewalDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {isCanceled && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-900">
                Subscription canceled. Access ends on{" "}
                {renewalDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={isLoading}
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Manage billing"}
          </button>
        </div>
      </div>

    </div>
  );
}

