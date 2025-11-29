"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountOverviewSectionProps = {
  name: string | null;
  email: string;
  timezone: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
};

export function AccountOverviewSection({
  name,
  email,
  timezone,
  workStartTime,
  workEndTime,
}: AccountOverviewSectionProps) {
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [isEditingWorkingHours, setIsEditingWorkingHours] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || "America/New_York");
  const [currentTimezone, setCurrentTimezone] = useState(timezone); // Track current displayed timezone
  
  // Parse time strings (HH:MM) to hours and minutes
  const parseTime = (timeStr: string | null, defaultTime: string) => {
    if (!timeStr) return defaultTime;
    // Handle both HH:MM and HH:MM:SS formats
    return timeStr.substring(0, 5);
  };
  
  const defaultStartTime = parseTime(workStartTime, "09:00");
  const defaultEndTime = parseTime(workEndTime, "17:00");
  
  const [selectedStartTime, setSelectedStartTime] = useState(defaultStartTime);
  const [selectedEndTime, setSelectedEndTime] = useState(defaultEndTime);
  const [currentStartTime, setCurrentStartTime] = useState(defaultStartTime);
  const [currentEndTime, setCurrentEndTime] = useState(defaultEndTime);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Common timezones for travelers/remote workers
  const commonTimezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Phoenix", label: "Arizona (MST)" },
    { value: "America/Anchorage", label: "Alaska (AKST)" },
    { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Australia/Sydney", label: "Sydney (AEDT)" },
    { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimezoneChange = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: selectedTimezone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update timezone");
      }

      setSuccess("Timezone updated successfully");
      setCurrentTimezone(selectedTimezone); // Update displayed timezone immediately
      setIsEditingTimezone(false);
      setTimeout(() => {
        setSuccess(null);
        window.location.reload(); // Reload to reflect timezone change in other parts of app
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update timezone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkingHoursChange = async () => {
    setError(null);
    setSuccess(null);
    
    // Validate times
    const [startHours, startMinutes] = selectedStartTime.split(":").map(Number);
    const [endHours, endMinutes] = selectedEndTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes <= startTotalMinutes) {
      setError("End time must be after start time");
      return;
    }
    
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/working-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workStartTime: selectedStartTime,
          workEndTime: selectedEndTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update working hours");
      }

      setSuccess("Working hours updated successfully");
      setCurrentStartTime(selectedStartTime);
      setCurrentEndTime(selectedEndTime);
      setIsEditingWorkingHours(false);
      setTimeout(() => {
        setSuccess(null);
        window.location.reload(); // Reload to reflect working hours change in capacity calculations
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update working hours");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-sm">
        <div>
          <div className="text-zinc-500 mb-1">Name</div>
          <div className="font-medium text-zinc-900">
            {name || "Not set"}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 mb-1">Email</div>
          <div className="font-medium text-zinc-900">{email}</div>
        </div>
        <div>
          <div className="text-zinc-500 mb-2">Timezone</div>
          {isEditingTimezone ? (
            <div className="space-y-3">
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                disabled={isSaving}
              >
                {commonTimezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {error && (
                <p className="text-xs text-red-700">{error}</p>
              )}
              {success && (
                <p className="text-xs text-green-700">{success}</p>
              )}
              <div className="flex gap-2 items-center justify-start" style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={handleTimezoneChange}
                  disabled={isSaving}
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    flex: '0 0 auto',
                    minWidth: '80px',
                    height: '32px',
                    opacity: isSaving ? 0.5 : 1,
                    isolation: 'isolate',
                    WebkitTransform: 'translateZ(0)',
                    transform: 'translateZ(0)',
                  }}
                  className="safari-purple-fix rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTimezone(false);
                    setSelectedTimezone(timezone || "America/New_York");
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isSaving}
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    flex: '0 0 auto',
                    minWidth: '80px',
                    height: '32px',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="font-medium text-zinc-900">
                {currentTimezone
                  ? commonTimezones.find((tz) => tz.value === currentTimezone)?.label ||
                    currentTimezone
                  : "Not set"}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTimezone(true)}
                className="text-xs font-medium text-purple-700 hover:text-purple-800 underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="text-zinc-500 mb-2">Working hours</div>
          {isEditingWorkingHours ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="start-time"
                    className="block text-xs font-medium text-zinc-900 mb-1"
                  >
                    Start time
                  </label>
                  <input
                    id="start-time"
                    type="time"
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    disabled={isSaving}
                    step="900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="end-time"
                    className="block text-xs font-medium text-zinc-900 mb-1"
                  >
                    End time
                  </label>
                  <input
                    id="end-time"
                    type="time"
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    disabled={isSaving}
                    step="900"
                  />
                </div>
              </div>
              {error && (
                <p className="text-xs text-red-700">{error}</p>
              )}
              {success && (
                <p className="text-xs text-green-700">{success}</p>
              )}
              <div className="flex gap-2 items-center justify-start" style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={handleWorkingHoursChange}
                  disabled={isSaving}
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    flex: '0 0 auto',
                    minWidth: '80px',
                    height: '32px',
                    opacity: isSaving ? 0.5 : 1,
                    isolation: 'isolate',
                    WebkitTransform: 'translateZ(0)',
                    transform: 'translateZ(0)',
                  }}
                  className="safari-purple-fix rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingWorkingHours(false);
                    setSelectedStartTime(currentStartTime);
                    setSelectedEndTime(currentEndTime);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isSaving}
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    flex: '0 0 auto',
                    minWidth: '80px',
                    height: '32px',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="font-medium text-zinc-900">
                {currentStartTime} - {currentEndTime}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingWorkingHours(true)}
                className="text-xs font-medium text-purple-700 hover:text-purple-800 underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-4">
        {isEditingPassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-medium text-zinc-900 mb-1"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter new password"
                disabled={isSaving}
                minLength={6}
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-medium text-zinc-900 mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Confirm new password"
                disabled={isSaving}
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-700">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-700">{success}</p>
            )}
            <div className="flex gap-2 items-center justify-start" style={{ width: '100%' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{ 
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  flex: '0 0 auto',
                  minWidth: '120px',
                  height: '32px',
                  opacity: isSaving ? 0.5 : 1,
                  isolation: 'isolate',
                  WebkitTransform: 'translateZ(0)',
                  transform: 'translateZ(0)',
                }}
                className="safari-purple-fix rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {isSaving ? "Saving..." : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingPassword(false);
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isSaving}
                style={{ 
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  flex: '0 0 auto',
                  minWidth: '80px',
                  height: '32px',
                  opacity: isSaving ? 0.5 : 1,
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingPassword(true)}
            className="text-xs font-medium text-purple-700 hover:text-purple-800 underline"
          >
            Change password
          </button>
        )}
      </div>
    </div>
  );
}

