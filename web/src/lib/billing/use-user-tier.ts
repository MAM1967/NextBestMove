"use client";

import { useState, useEffect } from "react";
import type { UserTier } from "./tier";

/**
 * Client-side hook to fetch user tier
 * 
 * This hook fetches the user's tier from the API.
 * For server components, use getUserTier from tier.ts directly.
 */
export function useUserTier() {
  const [tier, setTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTier() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/billing/tier");
        if (!response.ok) {
          throw new Error("Failed to fetch tier");
        }
        const data = await response.json();
        setTier(data.tier || "free");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tier");
        setTier("free"); // Default to free on error
      } finally {
        setLoading(false);
      }
    }

    fetchTier();
  }, []);

  return { tier, loading, error };
}





