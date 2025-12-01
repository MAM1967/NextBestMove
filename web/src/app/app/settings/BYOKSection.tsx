"use client";

import { useState } from "react";
import { isValidOpenAIKey } from "@/lib/encryption";

type BYOKSectionProps = {
  isPremium: boolean;
  currentProvider?: string | null;
  currentModel?: string | null;
  hasApiKey: boolean;
};

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (fastest, cheapest)" },
  { value: "gpt-4o", label: "GPT-4o (balanced)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (high quality)" },
  { value: "gpt-4", label: "GPT-4 (highest quality)" },
];

export function BYOKSection({
  isPremium,
  currentProvider,
  currentModel,
  hasApiKey,
}: BYOKSectionProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(currentModel || "gpt-4o-mini");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isPremium) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-zinc-900">Bring Your Own API Key</p>
            <p className="text-xs text-zinc-600">
              Use your own OpenAI API key for premium models and cost control.
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            Premium feature
          </span>
        </div>
      </div>
    );
  }

  const handleTest = async () => {
    if (!apiKey || !isValidOpenAIKey(apiKey)) {
      setError("Please enter a valid OpenAI API key (starts with sk-)");
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test API key");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test API key");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey && currentProvider === "openai") {
      // Removing API key - switch back to system
      setError(null);
      setIsSaving(true);
      try {
        const response = await fetch("/api/ai/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ai_provider: "system",
            ai_api_key: null,
            ai_model: null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }

        setSuccess(true);
        setApiKey("");
        setTimeout(() => {
          setSuccess(false);
          window.location.reload(); // Reload to reflect changes
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!apiKey || !isValidOpenAIKey(apiKey)) {
      setError("Please enter a valid OpenAI API key (starts with sk-)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_provider: "openai",
          ai_api_key: apiKey,
          ai_model: model,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload(); // Reload to reflect changes
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-900">
          Bring Your Own API Key
        </h3>
        <p className="text-xs text-zinc-600">
          Use your own OpenAI API key to access premium models and control costs.
          Your key is encrypted and stored securely.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              hasApiKey ? "Enter new key to update" : "sk-..."
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {hasApiKey && (
            <p className="mt-1 text-xs text-zinc-500">
              Key is saved. Enter a new key to update it.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {OPENAI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
            Preferences saved successfully!
          </div>
        )}

        <div className="flex gap-2">
          {apiKey && (
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || isSaving}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {isTesting ? "Testing..." : "Test Key"}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isTesting}
            className="flex-1 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : hasApiKey && !apiKey ? "Use System Key" : "Save"}
          </button>
        </div>

        {hasApiKey && (
          <button
            type="button"
            onClick={() => {
              setApiKey("");
              handleSave();
            }}
            className="w-full text-xs text-zinc-600 hover:text-zinc-900 underline"
          >
            Remove API key and use system default
          </button>
        )}
      </div>
    </div>
  );
}



