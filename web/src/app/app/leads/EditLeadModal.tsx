"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Lead, RelationshipCadence, RelationshipTier } from "@/lib/leads/types";
import {
  getCadenceRange,
  getCadenceDaysDefault,
  validateCadenceDays,
} from "@/lib/leads/relationship-status";
import { NotesSummary } from "./NotesSummary";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (
    leadId: string,
    leadData: {
      name: string;
      url: string;
      notes?: string;
      cadence?: RelationshipCadence | null;
      cadence_days?: number | null;
      tier?: RelationshipTier | null;
    }
  ) => Promise<void>;
}

export function EditLeadModal({
  isOpen,
  onClose,
  lead,
  onSave,
}: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    notes: "",
    cadence: "" as RelationshipCadence | "",
    cadence_days: null as number | null,
    tier: "" as RelationshipTier | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper to strip mailto: prefix for display
  const stripMailto = (url: string): string => {
    if (url.startsWith("mailto:")) {
      return url.substring(7);
    }
    return url;
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        url: stripMailto(lead.url), // Show email without mailto: prefix
        notes: lead.notes || "",
        cadence: (lead.cadence || "") as RelationshipCadence | "",
        cadence_days: lead.cadence_days || null,
        tier: (lead.tier || "") as RelationshipTier | "",
      });
      setErrors({});
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

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
    
    // Validate cadence_days if cadence is set (and not ad_hoc)
    if (formData.cadence && formData.cadence !== "ad_hoc") {
      if (formData.cadence_days === null || formData.cadence_days === undefined) {
        newErrors.cadence_days = "Please specify the number of days";
      } else {
        const range = getCadenceRange(formData.cadence);
        if (range && !validateCadenceDays(formData.cadence, formData.cadence_days)) {
          newErrors.cadence_days = `Must be between ${range.min} and ${range.max} days`;
        }
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
      // Get cadence_days - use default if not specified and cadence is not ad_hoc
      let cadenceDays = formData.cadence_days;
      if (formData.cadence && formData.cadence !== "ad_hoc" && !cadenceDays) {
        cadenceDays = getCadenceDaysDefault(formData.cadence);
      }
      
      await onSave(lead.id, {
        name: formData.name.trim(),
        url: normalizedUrl,
        notes: formData.notes.trim() || undefined,
        cadence: formData.cadence || null,
        cadence_days: formData.cadence === "ad_hoc" ? null : cadenceDays,
        tier: formData.tier || null,
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to update lead. Please try again.",
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
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            Edit Relationship
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-cadence"
                className="block text-sm font-medium text-zinc-900"
              >
                Follow-up Cadence
              </label>
              <select
                id="edit-cadence"
                value={formData.cadence || ""}
                onChange={(e) => {
                  const newCadence = (e.target.value || null) as RelationshipCadence | null;
                  const defaultDays = newCadence ? getCadenceDaysDefault(newCadence) : null;
                  setFormData((prev) => ({
                    ...prev,
                    cadence: newCadence || "",
                    cadence_days: defaultDays,
                  }));
                }}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">Not set</option>
                <option value="frequent">Frequent (7-14 days)</option>
                <option value="moderate">Moderate (30-90 days)</option>
                <option value="infrequent">Infrequent (180-365 days)</option>
                <option value="ad_hoc">Ad-hoc</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                How often to follow up
              </p>
              {/* Show days input when cadence is selected (not ad_hoc) */}
              {formData.cadence && formData.cadence !== "ad_hoc" && (() => {
                const range = getCadenceRange(formData.cadence);
                return range ? (
                  <div className="mt-2">
                    <label
                      htmlFor="edit-cadence_days"
                      className="block text-xs font-medium text-zinc-700"
                    >
                      Days within range ({range.min}-{range.max})
                    </label>
                    <input
                      id="edit-cadence_days"
                      type="number"
                      min={range.min}
                      max={range.max}
                      value={formData.cadence_days || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cadence_days: e.target.value ? parseInt(e.target.value, 10) : null,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder={`Default: ${range.min} days`}
                    />
                    {errors.cadence_days && (
                      <p className="mt-1 text-xs text-red-600">{errors.cadence_days}</p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            <div>
              <label
                htmlFor="edit-tier"
                className="block text-sm font-medium text-zinc-900"
              >
                Relationship Tier (optional)
              </label>
              <select
                id="edit-tier"
                value={formData.tier || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tier: (e.target.value || null) as typeof formData.tier | null,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">Not set</option>
                <option value="inner">Inner</option>
                <option value="active">Active</option>
                <option value="warm">Warm</option>
                <option value="background">Background</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Relationship importance
              </p>
            </div>
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

        {/* Notes Summary Section */}
        {lead && (
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <NotesSummary relationshipId={lead.id} />
          </div>
        )}
      </div>
    </div>
  );
}

