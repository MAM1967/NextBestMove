/**
 * Idempotency utilities for Stripe operations
 * 
 * Prevents duplicate charges and other side effects by ensuring
 * operations can be safely retried.
 */

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generate an idempotency key from user ID and operation parameters
 * 
 * @param userId - User ID
 * @param operation - Operation type (e.g., "checkout_session", "subscription_create")
 * @param params - Operation-specific parameters that should be consistent
 * @returns Idempotency key string
 */
export function generateIdempotencyKey(
  userId: string,
  operation: string,
  params: Record<string, any>
): string {
  // Sort params to ensure consistent key generation
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  // Create a deterministic key from user ID, operation, and params
  const keyData = JSON.stringify({ userId, operation, params: sortedParams });
  const hash = createHash("sha256").update(keyData).digest("hex");
  
  // Use first 32 chars of hash (Stripe idempotency keys must be <= 255 chars)
  return `${operation}_${userId}_${hash.substring(0, 24)}`;
}

/**
 * Check if an operation with this idempotency key has already been processed
 * 
 * @param idempotencyKey - The idempotency key
 * @returns Object with `exists: boolean` and `result?: any` if exists
 */
export async function checkIdempotency(
  idempotencyKey: string
): Promise<{ exists: boolean; result?: any }> {
  try {
    const supabase = createAdminClient(); // Use admin client to bypass RLS
    const { data, error } = await supabase
      .from("idempotency_keys")
      .select("result, created_at")
      .eq("key", idempotencyKey)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected
      console.error("Error checking idempotency:", error);
      // Fail open - if we can't check, allow the operation
      return { exists: false };
    }

    if (data) {
      return { exists: true, result: data.result };
    }

    return { exists: false };
  } catch (error) {
    console.error("Exception checking idempotency:", error);
    // Fail open - if we can't check, allow the operation
    return { exists: false };
  }
}

/**
 * Store the result of an idempotent operation
 * 
 * @param idempotencyKey - The idempotency key
 * @param result - Result to store (will be JSON stringified)
 * @returns Success boolean
 */
export async function storeIdempotencyResult(
  idempotencyKey: string,
  result: any
): Promise<boolean> {
  try {
    const supabase = createAdminClient(); // Use admin client to bypass RLS
    const { error } = await supabase.from("idempotency_keys").insert({
      key: idempotencyKey,
      result: result,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // If it's a unique constraint violation, that's okay - means another request already stored it
      if (error.code === "23505") {
        console.log("Idempotency key already exists (expected on concurrent requests):", idempotencyKey);
        return true;
      }
      console.error("Error storing idempotency result:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception storing idempotency result:", error);
    return false;
  }
}

/**
 * Execute an operation with idempotency protection
 * 
 * @param idempotencyKey - The idempotency key
 * @param operation - Async function that performs the operation
 * @returns Result of the operation (from cache if exists, or from execution)
 */
export async function executeWithIdempotency<T>(
  idempotencyKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if already processed
  const checkResult = await checkIdempotency(idempotencyKey);
  if (checkResult.exists && checkResult.result) {
    console.log("Returning cached result for idempotency key:", idempotencyKey);
    return checkResult.result as T;
  }

  // Execute operation
  const result = await operation();

  // Store result (non-blocking - don't fail if storage fails)
  await storeIdempotencyResult(idempotencyKey, result).catch((error) => {
    console.error("Failed to store idempotency result (non-critical):", error);
  });

  return result;
}

