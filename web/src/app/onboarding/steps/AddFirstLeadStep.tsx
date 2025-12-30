"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface AddFirstLeadStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddFirstLeadStep({
  onNext,
  onBack,
}: AddFirstLeadStepProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    linkedin_url: "",
    email: "",
    phone_number: "",
    url: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          linkedin_url: formData.linkedin_url.trim() || null,
          email: formData.email.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          url: formData.url.trim() || null,
          notes: formData.notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save relationship");
      }

      router.refresh();
      onNext();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to save relationship. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Add your first relationship
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Start by adding someone you want to network with and see how you can help them. This could be a potential client, a warm referral, or someone you met recently. You can add more later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-900"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Enter person's name"
            required
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="linkedin_url"
            className="block text-sm font-medium text-zinc-900"
          >
            LinkedIn URL (optional)
          </label>
          <input
            id="linkedin_url"
            type="url"
            value={formData.linkedin_url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            htmlFor="email"
            className="block text-sm font-medium text-zinc-900"
          >
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            htmlFor="phone_number"
            className="block text-sm font-medium text-zinc-900"
          >
            Phone Number (optional)
          </label>
          <input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            htmlFor="url"
            className="block text-sm font-medium text-zinc-900"
          >
            Other URL (optional)
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, url: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            htmlFor="notes"
            className="block text-sm font-medium text-zinc-900"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            onClick={onBack}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}

