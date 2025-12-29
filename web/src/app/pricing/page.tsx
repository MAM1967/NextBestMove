"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRICING_FEATURES, PRICING_TIERS } from "@/lib/billing/pricing-features";
import { TIER_INFO } from "@/lib/billing/tier-labels";
import type { FeatureValue } from "@/lib/billing/pricing-features";
import type { UserTier } from "@/lib/billing/tier";

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "standard" | "premium") => {
    setLoading(plan);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval: billingInterval,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const formatFeatureValue = (value: FeatureValue): string => {
    if (value === "✓") return "✓";
    if (value === "-") return "-";
    if (typeof value === "boolean") return value ? "✓" : "-";
    return String(value);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-black" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              NextBestMove
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/auth/sign-in"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              Sign in
            </a>
            <a
              href="/auth/sign-up"
              className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Start with a 14-day Standard trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm ${billingInterval === "month" ? "text-zinc-900 font-medium" : "text-zinc-500"}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === "year" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === "year" ? "text-zinc-900 font-medium" : "text-zinc-500"}`}>
              Yearly
              <span className="ml-1 text-xs text-emerald-600">(Save up to $299/year)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-16">
          {PRICING_TIERS.map((tier) => {
            const price = billingInterval === "month" ? tier.monthlyPrice : tier.yearlyPrice;
            const displayPrice = billingInterval === "month" 
              ? formatPrice(tier.monthlyPrice) 
              : formatPrice(tier.yearlyPrice);
            const period = billingInterval === "month" ? "/month" : "/year";

            return (
              <div
                key={tier.name}
                className={`relative rounded-xl border-2 bg-white p-8 shadow-sm ${
                  tier.popular
                    ? "border-black ring-2 ring-black"
                    : "border-zinc-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-zinc-900">{tier.name}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{tier.tagline}</p>
                  <p className="mt-1 text-xs text-zinc-500">{tier.description}</p>

                  <div className="mt-6">
                    <span className="text-4xl font-semibold text-zinc-900">{displayPrice}</span>
                    {price > 0 && (
                      <span className="text-lg text-zinc-600">{period}</span>
                    )}
                  </div>

                  {billingInterval === "year" && tier.yearlySavings > 0 && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      Save ${tier.yearlySavings}/year
                    </p>
                  )}

                  {tier.name === "Free" ? (
                    <a
                      href="/auth/sign-up"
                      className="mt-6 block w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                    >
                      Get started
                    </a>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier.name.toLowerCase() as "standard" | "premium")}
                      disabled={loading === tier.name.toLowerCase()}
                      className="mt-6 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === tier.name.toLowerCase() ? "Loading..." : "Start 14-day trial"}
                    </button>
                  )}

                  <p className="mt-2 text-xs text-zinc-500">
                    {tier.name === "Free" 
                      ? "Forever free" 
                      : "No credit card required"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-xl font-semibold text-zinc-900">Feature Comparison</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Compare what&apos;s included in each plan
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">
                    Feature
                  </th>
                  {PRICING_TIERS.map((tier) => (
                    <th
                      key={tier.name}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        tier.popular ? "bg-zinc-50" : ""
                      }`}
                    >
                      {tier.name}
                      {tier.popular && (
                        <span className="ml-2 text-xs text-zinc-500">(Recommended)</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_FEATURES.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={`border-b border-zinc-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-900">{feature.name}</div>
                      {feature.description && (
                        <div className="mt-1 text-xs text-zinc-500">{feature.description}</div>
                      )}
                    </td>
                    {PRICING_TIERS.map((tier) => {
                      const tierKey = tier.name.toLowerCase() as "free" | "standard" | "premium";
                      const value = feature[tierKey];
                      const displayValue = formatFeatureValue(value);
                      const isAvailable = value !== "-" && value !== false;

                      return (
                        <td
                          key={tier.name}
                          className={`px-6 py-4 text-center text-sm ${
                            tier.popular ? "bg-zinc-50" : ""
                          } ${
                            isAvailable ? "text-zinc-900" : "text-zinc-400"
                          }`}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-zinc-200">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.name} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">{tier.name}</h3>
                  <p className="text-sm text-zinc-600">{tier.tagline}</p>
                </div>
                <div className="space-y-3">
                  {PRICING_FEATURES.map((feature) => {
                    const tierKey = tier.name.toLowerCase() as "free" | "standard" | "premium";
                    const value = feature[tierKey];
                    const displayValue = formatFeatureValue(value);
                    const isAvailable = value !== "-" && value !== false;

                    return (
                      <div key={feature.name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-900">{feature.name}</div>
                          {feature.description && (
                            <div className="text-xs text-zinc-500">{feature.description}</div>
                          )}
                        </div>
                        <div className={`text-sm font-medium ${
                          isAvailable ? "text-zinc-900" : "text-zinc-400"
                        }`}>
                          {displayValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
            Questions about pricing?
          </h2>
          <p className="text-zinc-600 mb-6">
            All plans include a 14-day Standard trial. No credit card required.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">14-day trial</h3>
              <p className="text-sm text-zinc-600">
                Start with Standard features for 14 days. No credit card required. Cancel anytime.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Annual savings</h3>
              <p className="text-sm text-zinc-600">
                Save $99/year on Standard or $299/year on Premium when you choose annual billing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Upgrade anytime</h3>
              <p className="text-sm text-zinc-600">
                Start with Free or Standard and upgrade to Premium when you need advanced features.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

