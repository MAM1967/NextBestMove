"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Lead, RelationshipCadence, RelationshipTier, PreferredChannel } from "@/lib/leads/types";
import {
  getCadenceRange,
  getCadenceDaysDefault,
  validateCadenceDays,
} from "@/lib/leads/relationship-status";
import { NotesSummary } from "./NotesSummary";
import { Signals } from "./Signals";
import { MeetingNotes } from "./MeetingNotes";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (
    leadId: string,
    leadData: {
      name: string;
      linkedin_url?: string | null;
      email?: string | null;
      phone_number?: string | null;
      url?: string | null;
      notes?: string;
      cadence?: RelationshipCadence | null;
      cadence_days?: number | null;
      tier?: RelationshipTier | null;
      preferred_channel?: PreferredChannel;
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
    linkedin_url: "",
    email: "",
    phone_number: "",
    url: "",
    notes: "",
    cadence: "" as RelationshipCadence | "",
    cadence_days: null as number | null,
    tier: "" as RelationshipTier | "",
    preferred_channel: "" as PreferredChannel | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper to extract email from legacy mailto: URL
  const extractEmailFromUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("mailto:")) {
      return url.substring(7);
    }
    return "";
  };

  // Helper to check if URL is LinkedIn
  const isLinkedInUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.includes("linkedin.com");
  };

  useEffect(() => {
    if (lead) {
      // Extract email from legacy url field if email field is empty
      const emailFromUrl = lead.email || extractEmailFromUrl(lead.url);
      // Extract LinkedIn URL from legacy url field if linkedin_url is empty
      const linkedinFromUrl = lead.linkedin_url || (isLinkedInUrl(lead.url) ? lead.url : "");
      // Keep non-LinkedIn URLs in url field
      const otherUrl = (!isLinkedInUrl(lead.url) && !lead.url?.startsWith("mailto:")) ? lead.url : "";
      
      setFormData({
        name: lead.name,
        linkedin_url: linkedinFromUrl || "",
        email: emailFromUrl || "",
        phone_number: lead.phone_number || "",
        url: otherUrl || "",
        notes: lead.notes || "",
        cadence: (lead.cadence || "") as RelationshipCadence | "",
        cadence_days: lead.cadence_days || null,
        tier: (lead.tier || "") as RelationshipTier | "",
        preferred_channel: (lead.preferred_channel || "") as PreferredChannel | "",
      });
      setErrors({});
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Validate LinkedIn URL format
  const isValidLinkedInUrl = (url: string): boolean => {
    const trimmed = url.trim();
    return trimmed.includes("linkedin.com") && 
           (trimmed.startsWith("https://") || trimmed.startsWith("http://"));
  };

  // Validate phone number format (basic - for future SMS support)
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone.trim()) && phone.trim().replace(/\D/g, "").length >= 10;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    // At least one contact method should be provided (LinkedIn, email, or phone)
    const hasLinkedIn = formData.linkedin_url.trim().length > 0;
    const hasEmail = formData.email.trim().length > 0;
    const hasPhone = formData.phone_number.trim().length > 0;
    const hasUrl = formData.url.trim().length > 0;
    
    if (!hasLinkedIn && !hasEmail && !hasPhone && !hasUrl) {
      newErrors.contact = "Please provide at least one contact method (LinkedIn URL, email, or phone number)";
    }
    
    // Validate LinkedIn URL if provided
    if (hasLinkedIn && !isValidLinkedInUrl(formData.linkedin_url)) {
      newErrors.linkedin_url = "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/...)";
    }
    
    // Validate email if provided
    if (hasEmail && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Validate phone if provided
    if (hasPhone && !isValidPhoneNumber(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number";
    }
    
    // Validate URL if provided (for non-LinkedIn URLs like CRM links)
    if (hasUrl && !formData.url.startsWith("https://") && !formData.url.startsWith("http://")) {
      newErrors.url = "Please enter a valid URL (https://...)";
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
      // Get cadence_days - use default if not specified and cadence is not ad_hoc
      let cadenceDays = formData.cadence_days;
      if (formData.cadence && formData.cadence !== "ad_hoc" && !cadenceDays) {
        cadenceDays = getCadenceDaysDefault(formData.cadence);
      }
      
      await onSave(lead.id, {
        name: formData.name.trim(),
        linkedin_url: formData.linkedin_url.trim() || null,
        email: formData.email.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        url: formData.url.trim() || null,
        notes: formData.notes.trim() || undefined,
        cadence: formData.cadence || null,
        cadence_days: formData.cadence === "ad_hoc" ? null : cadenceDays,
        tier: formData.tier || null,
        preferred_channel: formData.preferred_channel === "" ? null : (formData.preferred_channel as PreferredChannel),
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
              htmlFor="edit-linkedin_url"
              className="block text-sm font-medium text-zinc-900"
            >
              LinkedIn URL (optional)
            </label>
            <input
              id="edit-linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="https://linkedin.com/in/..."
            />
            <p className="mt-1 text-xs text-zinc-500">
              LinkedIn profile URL. Used by signals to monitor LinkedIn activity.
            </p>
            {errors.linkedin_url && (
              <p className="mt-1 text-xs text-red-600">{errors.linkedin_url}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-zinc-900"
            >
              Email (optional)
            </label>
            <input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="name@example.com"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Email address. Used by signals to monitor email communications.
            </p>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-phone_number"
              className="block text-sm font-medium text-zinc-900"
            >
              Phone Number (optional)
            </label>
            <input
              id="edit-phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="+1 (555) 123-4567"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Phone number for SMS communication (future feature).
            </p>
            {errors.phone_number && (
              <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-url"
              className="block text-sm font-medium text-zinc-900"
            >
              Other URL (optional)
            </label>
            <input
              id="edit-url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="https://crm.example.com/contact/123"
            />
            <p className="mt-1 text-xs text-zinc-500">
              CRM link or other URL (optional). At least one contact method (LinkedIn, email, or phone) is recommended for signals.
            </p>
            {errors.url && (
              <p className="mt-1 text-xs text-red-600">{errors.url}</p>
            )}
            {errors.contact && (
              <p className="mt-1 text-xs text-red-600">{errors.contact}</p>
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

          <div>
            <label
              htmlFor="edit-preferred_channel"
              className="block text-sm font-medium text-zinc-900"
            >
              Preferred Channel (optional)
            </label>
            <select
              id="edit-preferred_channel"
              value={formData.preferred_channel || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  preferred_channel: (e.target.value || null) as PreferredChannel | null,
                }))
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Not set</option>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Preferred way to communicate with this person
            </p>
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

        {/* Meeting Notes Section */}
        {lead && (
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <MeetingNotes leadId={lead.id} />
          </div>
        )}

        {/* Signals Section */}
        {lead && (
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <Signals leadId={lead.id} />
          </div>
        )}
      </div>
    </div>
  );
}

