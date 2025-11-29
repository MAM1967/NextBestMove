"use client";

import { useEffect } from "react";
import { usePostHog } from "@/lib/analytics/posthog";

/**
 * Client component to initialize PostHog analytics
 * Must be a client component because PostHog runs in the browser
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  usePostHog();
  return <>{children}</>;
}

