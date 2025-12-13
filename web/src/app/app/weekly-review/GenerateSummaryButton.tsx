"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateSummaryButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/weekly-summaries/generate", {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        const errorMsg = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || "Unknown error";
        alert(`Failed to generate review: ${errorMsg}`);
      }
    } catch (error) {
      alert("Failed to generate review. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {isGenerating ? "Generating..." : "Generate Review"}
    </button>
  );
}

