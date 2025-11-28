"use client";

import { useState } from "react";
import { getPlanMetadata, type PlanType, type IntervalType } from "@/lib/billing/plans";

type PlanSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PlanType, interval: IntervalType) => void;
  isLoading?: boolean;
};

const PLANS: { type: PlanType; name: string; features: string[] }[] = [
  {
    type: "standard",
    name: "Standard",
    features: [
      "Daily action plans",
      "Weekly summaries",
      "AI insights",
      "Up to 50 pins",
      "Calendar integration",
    ],
  },
  {
    type: "professional",
    name: "Professional",
    features: [
      "Everything in Standard",
      "Unlimited pins",
      "Pattern detection",
      "Pre-call briefs",
      "Performance timeline",
      "Content engine",
    ],
  },
];

export function PlanSelectionModal({
  isOpen,
  onClose,
  onSelectPlan,
  isLoading = false,
}: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("standard");
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("month");

  if (!isOpen) return null;

  const handleSubscribe = () => {
    onSelectPlan(selectedPlan, selectedInterval);
  };

  const standardMonthly = getPlanMetadata("standard", "month");
  const standardYearly = getPlanMetadata("standard", "year");
  const professionalMonthly = getPlanMetadata("professional", "month");
  const professionalYearly = getPlanMetadata("professional", "year");

  const monthlySavings =
    standardYearly && standardMonthly
      ? Math.round(
          ((standardMonthly.amount * 12 - standardYearly.amount) /
            (standardMonthly.amount * 12)) *
            100
        )
      : 0;
  const professionalYearlySavings =
    professionalYearly && professionalMonthly
      ? Math.round(
          ((professionalMonthly.amount * 12 - professionalYearly.amount) /
            (professionalMonthly.amount * 12)) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-xl my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          disabled={isLoading}
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

        <div className="p-6 pb-8">
          <h2 className="text-2xl font-bold text-zinc-900">
            Choose Your Plan
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Start your 14-day free trial. No credit card required.
          </p>

          {/* Interval Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              <button
                onClick={() => setSelectedInterval("month")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  selectedInterval === "month"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
                disabled={isLoading}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedInterval("year")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  selectedInterval === "year"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
                disabled={isLoading}
              >
                Yearly
                {selectedInterval === "year" && (
                  <span className="ml-1.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">
                    Save {selectedPlan === "standard" ? monthlySavings : professionalYearlySavings}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => {
              const metadata =
                selectedInterval === "month"
                  ? getPlanMetadata(plan.type, "month")
                  : getPlanMetadata(plan.type, "year");
              const isSelected = selectedPlan === plan.type;
              const isProfessional = plan.type === "professional";

              if (!metadata) {
                return null;
              }

              return (
                <button
                  key={plan.type}
                  onClick={() => setSelectedPlan(plan.type)}
                  disabled={isLoading}
                  className={`relative rounded-xl border-2 p-6 text-left transition ${
                    isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  } ${isLoading ? "opacity-50" : ""}`}
                >
                  {isSelected && (
                    <div className="absolute right-4 top-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {isProfessional && (
                    <div className="mb-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-zinc-900">
                    {plan.name}
                  </h3>

                  <div className="mt-2">
                    <span className="text-3xl font-bold text-zinc-900">
                      ${(metadata.amount / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-zinc-600">
                      /{selectedInterval === "month" ? "month" : "year"}
                    </span>
                    {selectedInterval === "year" && (
                      <div className="mt-1 text-xs text-zinc-500">
                        ${((metadata.amount / 100) / 12).toFixed(2)}/month billed annually
                      </div>
                    )}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-zinc-600">
                        <svg
                          className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-zinc-200 pt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="rounded-full px-8 py-3 text-sm font-bold transition hover:shadow-lg disabled:opacity-50 shadow-md border-2 whitespace-nowrap"
              style={{ 
                color: '#ffffff', 
                backgroundColor: '#9333ea',
                borderColor: '#7e22ce',
                fontWeight: '700',
                fontSize: '14px',
                lineHeight: '20px'
              }}
            >
              {isLoading ? "Loading..." : "Start Free Trial"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

