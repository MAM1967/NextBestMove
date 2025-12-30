"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Lead } from "@/lib/leads/types";

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: Lead | null;
  onSave: (
    pinId: string,
    pinData: { name: string; url: string; notes?: string }
  ) => Promise<void>;
}

export function EditPersonModal({
  isOpen,
  onClose,
  pin,
  onSave,
}: EditPersonModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper to strip mailto: prefix for display
  const stripMailto = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("mailto:")) {
      return url.substring(7);
    }
    return url;
  };

  useEffect(() => {
    if (pin) {
      setFormData({
        name: pin.name,
        url: stripMailto(pin.url || pin.email ? `mailto:${pin.email}` : pin.linkedin_url || undefined), // Show email without mailto: prefix, or linkedin_url, or legacy url
        notes: pin.notes || "",
      });
      setErrors({});
    }
  }, [pin]);

  if (!isOpen || !pin) return null;

  // Helper function to normalize URL (auto-add mailto: for emails)
  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    // If it looks like an email address, prepend mailto:
    if (
      trimmed.includes("@") &&
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("mailto:")
    ) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmed)) {
        return `mailto:${trimmed}`;
      }
    }
    return trimmed;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.url.trim()) {
      newErrors.url = "URL or email is required";
    } else {
      const normalized = normalizeUrl(formData.url);
      if (
        !normalized.startsWith("https://") &&
        !normalized.startsWith("http://") &&
        !normalized.startsWith("mailto:")
      ) {
        newErrors.url =
          "Please enter a valid URL (https://...) or email address";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const normalizedUrl = normalizeUrl(formData.url);
      await onSave(pin.id, {
        name: formData.name.trim(),
        url: normalizedUrl,
        notes: formData.notes.trim() || undefined,
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to update pin. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            Edit Person
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-zinc-900"
            >
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Enter person's name"
              required
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-url"
              className="block text-sm font-medium text-zinc-900"
            >
              URL or Email
            </label>
            <input
              id="edit-url"
              type="text"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="https://linkedin.com/in/... or name@example.com"
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              Enter a LinkedIn profile URL, CRM link, or email address
            </p>
            {errors.url && (
              <p className="mt-1 text-xs text-red-600">{errors.url}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-notes"
              className="block text-sm font-medium text-zinc-900"
            >
              Notes (optional)
            </label>
            <textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Add context, reminders, or notes about this person..."
            />
          </div>

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

