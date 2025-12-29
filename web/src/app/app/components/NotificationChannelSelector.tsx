"use client";

import { useState } from "react";

type NotificationChannel = "email" | "push" | "both" | "none";

interface NotificationChannelSelectorProps {
  label: string;
  description?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  onEmailChange: (enabled: boolean) => void;
  onPushChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function NotificationChannelSelector({
  label,
  description,
  emailEnabled,
  pushEnabled,
  onEmailChange,
  onPushChange,
  disabled = false,
}: NotificationChannelSelectorProps) {
  const getChannelState = (): NotificationChannel => {
    if (emailEnabled && pushEnabled) return "both";
    if (emailEnabled) return "email";
    if (pushEnabled) return "push";
    return "none";
  };

  const channelState = getChannelState();

  const handleEmailToggle = () => {
    onEmailChange(!emailEnabled);
  };

  const handlePushToggle = () => {
    onPushChange(!pushEnabled);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="mb-3 space-y-1">
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {description && (
          <p className="text-xs text-zinc-600">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleEmailToggle}
          disabled={disabled}
          className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            emailEnabled
              ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
              : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Email {emailEnabled ? "✓" : ""}
        </button>
        <button
          type="button"
          onClick={handlePushToggle}
          disabled={disabled}
          className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            pushEnabled
              ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
              : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Push {pushEnabled ? "✓" : ""}
        </button>
        {channelState === "both" && (
          <span className="text-xs text-zinc-500">(Both enabled)</span>
        )}
        {channelState === "none" && (
          <span className="text-xs text-zinc-500">(Disabled)</span>
        )}
      </div>
    </div>
  );
}

