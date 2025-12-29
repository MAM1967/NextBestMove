/**
 * Supabase-related TypeScript types
 * 
 * Types for Supabase database responses and queries.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Standard Supabase response wrapper
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Type guard for Supabase error
 */
export function isSupabaseError(
  error: unknown
): error is { message: string; code?: string; details?: string; hint?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Extract error message from Supabase error or unknown error
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Helper type for Supabase query results
 */
export type SupabaseQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

/**
 * Helper to safely extract data from Supabase response
 */
export function extractSupabaseData<T>(
  response: SupabaseQueryResult<T>
): T | null {
  if (response.error) {
    console.error("Supabase error:", response.error);
    return null;
  }
  return response.data;
}

/**
 * Helper to check if Supabase response has error
 */
export function hasSupabaseError<T>(
  response: SupabaseQueryResult<T>
): response is { data: T | null; error: { message: string; code?: string } } {
  return response.error !== null;
}

