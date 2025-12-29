"use client";

import { useState } from "react";

type EmailPreferences = {
  email_morning_plan: boolean;
  email_fast_win_reminder: boolean;
  email_follow_up_alerts: boolean;
  email_weekly_summary: boolean;
  email_unsubscribed?: boolean;
};

type EmailPreferencesSectionProps = {
  initialPreferences: EmailPreferences;
};

export function EmailPreferencesSection({
  initialPreferences,
}: EmailPreferencesSectionProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const isUnsubscribed = preferences.email_unsubscribed ?? false;

  const handleToggle = async (key: keyof EmailPreferences) => {
    // If unsubscribed, re-enable all preferences when toggling any
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
      email_unsubscribed: false, // Re-subscribe when user changes any preference
    };
    setPreferences(newPreferences);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving email preferences:", error);
      // Revert on error
      setPreferences(initialPreferences);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm("Are you sure you want to unsubscribe from all emails? You can re-enable them later.")) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_morning_plan: false,
          email_fast_win_reminder: false,
          email_follow_up_alerts: false,
          email_weekly_summary: false,
          email_unsubscribed: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe");
      }

      setPreferences({
        email_morning_plan: false,
        email_fast_win_reminder: false,
        email_follow_up_alerts: false,
        email_weekly_summary: false,
        email_unsubscribed: true,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Failed to unsubscribe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          Preferences saved successfully!
        </div>
      )}
      {isUnsubscribed && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
          You&apos;re unsubscribed from all emails. Toggle any preference above to re-enable emails.
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <EmailPreferenceToggle
          label="Morning plan"
          description="Daily at 8am in your timezone."
          enabled={preferences.email_morning_plan && !isUnsubscribed}
          onToggle={() => handleToggle("email_morning_plan")}
          disabled={isSaving}
        />
        <EmailPreferenceToggle
          label="Fast win reminder"
          description="Nudge at 2pm if today&apos;s fast win is untouched."
          enabled={preferences.email_fast_win_reminder && !isUnsubscribed}
          onToggle={() => handleToggle("email_fast_win_reminder")}
          disabled={isSaving}
        />
        <EmailPreferenceToggle
          label="Follow-up alerts"
          description="Reminder when replies are overdue."
          enabled={preferences.email_follow_up_alerts && !isUnsubscribed}
          onToggle={() => handleToggle("email_follow_up_alerts")}
          disabled={isSaving}
        />
        <EmailPreferenceToggle
          label="Weekly review"
          description="Sunday night recap."
          enabled={preferences.email_weekly_summary && !isUnsubscribed}
          onToggle={() => handleToggle("email_weekly_summary")}
          disabled={isSaving}
        />
      </div>
      <div className="pt-2 border-t border-zinc-200 space-y-2">
        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={isSaving || isUnsubscribed}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUnsubscribed ? "Unsubscribed from all emails" : "Unsubscribe from all emails"}
        </button>
        <p className="text-xs text-zinc-500">
          💡 <strong>Tip:</strong> If you&apos;re not receiving emails, check your spam folder and mark NextBestMove emails as &quot;Not Spam&quot; to improve deliverability.
        </p>
      </div>
    </div>
  );
}

function EmailPreferenceToggle({
  label,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="space-y-1 text-sm">
        <p className="font-medium text-zinc-900">{label}</p>
        {description && <p className="text-xs text-zinc-600">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
          enabled
            ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
            : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {enabled ? "On" : "Off"}
      </button>
    </div>
  );
}

