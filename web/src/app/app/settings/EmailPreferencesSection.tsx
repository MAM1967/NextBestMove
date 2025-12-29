"use client";

import { useState, useEffect } from "react";
import { NotificationChannelSelector } from "../components/NotificationChannelSelector";

type NotificationPreferences = {
  morning_plan_email: boolean;
  morning_plan_push: boolean;
  fast_win_reminder_email: boolean;
  fast_win_reminder_push: boolean;
  follow_up_alerts_email: boolean;
  follow_up_alerts_push: boolean;
  weekly_summary_email: boolean;
  weekly_summary_push: boolean;
};

type EmailPreferencesSectionProps = {
  initialPreferences: {
    email_morning_plan: boolean;
    email_fast_win_reminder: boolean;
    email_follow_up_alerts: boolean;
    email_weekly_summary: boolean;
    email_unsubscribed?: boolean;
  };
};

export function EmailPreferencesSection({
  initialPreferences,
}: EmailPreferencesSectionProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    morning_plan_email: initialPreferences.email_morning_plan ?? true,
    morning_plan_push: false,
    fast_win_reminder_email: initialPreferences.email_fast_win_reminder ?? true,
    fast_win_reminder_push: false,
    follow_up_alerts_email: initialPreferences.email_follow_up_alerts ?? true,
    follow_up_alerts_push: false,
    weekly_summary_email: initialPreferences.email_weekly_summary ?? true,
    weekly_summary_push: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isUnsubscribed = initialPreferences.email_unsubscribed ?? false;

  // Fetch current preferences from new API
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/notifications/preferences");
        if (response.ok) {
          const data = (await response.json()) as NotificationPreferences;
          setPreferences(data);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleChannelChange = async (
    notificationType: keyof NotificationPreferences,
    enabled: boolean
  ) => {
    const newPreferences = {
      ...preferences,
      [notificationType]: enabled,
    };
    setPreferences(newPreferences);
    setIsSaving(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      // Revert on error
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = (await response.json()) as NotificationPreferences;
        setPreferences(data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (
      !confirm(
        "Are you sure you want to unsubscribe from all notifications? You can re-enable them later."
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      // Update via users table for global unsubscribe
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

      // Also disable all notification preferences
      const allDisabled: NotificationPreferences = {
        morning_plan_email: false,
        morning_plan_push: false,
        fast_win_reminder_email: false,
        fast_win_reminder_push: false,
        follow_up_alerts_email: false,
        follow_up_alerts_push: false,
        weekly_summary_email: false,
        weekly_summary_push: false,
      };

      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allDisabled),
      });

      setPreferences(allDisabled);
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
          You're unsubscribed from all emails. Toggle any preference above to re-enable emails.
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-zinc-600">Loading preferences...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <NotificationChannelSelector
            label="Morning plan"
            description="Daily at 8am in your timezone."
            emailEnabled={preferences.morning_plan_email && !isUnsubscribed}
            pushEnabled={preferences.morning_plan_push && !isUnsubscribed}
            onEmailChange={(enabled) =>
              handleChannelChange("morning_plan_email", enabled)
            }
            onPushChange={(enabled) =>
              handleChannelChange("morning_plan_push", enabled)
            }
            disabled={isSaving || isUnsubscribed}
          />
          <NotificationChannelSelector
            label="Fast win reminder"
            description="Nudge at 2pm if today's fast win is untouched."
            emailEnabled={
              preferences.fast_win_reminder_email && !isUnsubscribed
            }
            pushEnabled={preferences.fast_win_reminder_push && !isUnsubscribed}
            onEmailChange={(enabled) =>
              handleChannelChange("fast_win_reminder_email", enabled)
            }
            onPushChange={(enabled) =>
              handleChannelChange("fast_win_reminder_push", enabled)
            }
            disabled={isSaving || isUnsubscribed}
          />
          <NotificationChannelSelector
            label="Follow-up alerts"
            description="Reminder when replies are overdue."
            emailEnabled={preferences.follow_up_alerts_email && !isUnsubscribed}
            pushEnabled={preferences.follow_up_alerts_push && !isUnsubscribed}
            onEmailChange={(enabled) =>
              handleChannelChange("follow_up_alerts_email", enabled)
            }
            onPushChange={(enabled) =>
              handleChannelChange("follow_up_alerts_push", enabled)
            }
            disabled={isSaving || isUnsubscribed}
          />
          <NotificationChannelSelector
            label="Weekly review"
            description="Sunday night recap."
            emailEnabled={preferences.weekly_summary_email && !isUnsubscribed}
            pushEnabled={preferences.weekly_summary_push && !isUnsubscribed}
            onEmailChange={(enabled) =>
              handleChannelChange("weekly_summary_email", enabled)
            }
            onPushChange={(enabled) =>
              handleChannelChange("weekly_summary_push", enabled)
            }
            disabled={isSaving || isUnsubscribed}
          />
        </div>
      )}
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
          💡 <strong>Tip:</strong> If you're not receiving emails, check your spam folder and mark NextBestMove emails as "Not Spam" to improve deliverability.
        </p>
      </div>
    </div>
  );
}


