import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateIdempotencyKey,
  checkIdempotency,
  storeIdempotencyResult,
  executeWithIdempotency,
} from "@/lib/billing/idempotency";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("Billing Idempotency", () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
        insert: vi.fn(),
      })),
    };

    // Mock createAdminClient to return our mock
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as SupabaseClient
    );
  });

  describe("generateIdempotencyKey", () => {
    it("should generate stable keys for same inputs", () => {
      const userId = "user-123";
      const operation = "checkout_session";
      const params = { sessionId: "sess_123", priceId: "price_123" };

      const key1 = generateIdempotencyKey(userId, operation, params);
      const key2 = generateIdempotencyKey(userId, operation, params);

      expect(key1).toBe(key2);
      expect(key1).toContain(operation);
      expect(key1).toContain(userId);
    });

    it("should generate different keys for different inputs", () => {
      const userId = "user-123";
      const operation = "checkout_session";

      const key1 = generateIdempotencyKey(userId, operation, { sessionId: "sess_123" });
      const key2 = generateIdempotencyKey(userId, operation, { sessionId: "sess_456" });

      expect(key1).not.toBe(key2);
    });

    it("should generate different keys for different users", () => {
      const operation = "checkout_session";
      const params = { sessionId: "sess_123" };

      const key1 = generateIdempotencyKey("user-123", operation, params);
      const key2 = generateIdempotencyKey("user-456", operation, params);

      expect(key1).not.toBe(key2);
    });

    it("should handle params in any order (sorted internally)", () => {
      const userId = "user-123";
      const operation = "checkout_session";

      const key1 = generateIdempotencyKey(userId, operation, {
        priceId: "price_123",
        sessionId: "sess_123",
      });
      const key2 = generateIdempotencyKey(userId, operation, {
        sessionId: "sess_123",
        priceId: "price_123",
      });

      expect(key1).toBe(key2);
    });

    it("should generate keys <= 255 characters (Stripe limit)", () => {
      const userId = "user-123";
      const operation = "checkout_session";
      const params = { sessionId: "sess_123" };

      const key = generateIdempotencyKey(userId, operation, params);

      expect(key.length).toBeLessThanOrEqual(255);
    });
  });

  describe("checkIdempotency", () => {
    it("should return exists: false when key doesn't exist", async () => {
      // Mock: no data found
      const selectChain = {
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        select: vi.fn().mockReturnValue(selectChain),
      });

      const result = await checkIdempotency("test-key-123");

      expect(result.exists).toBe(false);
      expect(result.result).toBeUndefined();
    });

    it("should return exists: true with result when key exists", async () => {
      const cachedResult = { subscriptionId: "sub_123", status: "active" };

      // Mock: data found
      const selectChain = {
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { result: cachedResult, created_at: new Date().toISOString() },
            error: null,
          }),
        })),
      };
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        select: vi.fn().mockReturnValue(selectChain),
      });

      const result = await checkIdempotency("test-key-123");

      expect(result.exists).toBe(true);
      expect(result.result).toEqual(cachedResult);
    });

    it("should fail open on database errors", async () => {
      // Mock: database error
      const selectChain = {
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST301", message: "Database connection error" },
          }),
        })),
      };
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        select: vi.fn().mockReturnValue(selectChain),
      });

      const result = await checkIdempotency("test-key-123");

      // Should fail open (allow operation) on errors
      expect(result.exists).toBe(false);
    });

    it("should handle PGRST116 (not found) as expected", async () => {
      // Mock: PGRST116 is "not found" - should be treated as doesn't exist
      const selectChain = {
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        })),
      };
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        select: vi.fn().mockReturnValue(selectChain),
      });

      const result = await checkIdempotency("test-key-123");

      expect(result.exists).toBe(false);
    });
  });

  describe("storeIdempotencyResult", () => {
    it("should store result successfully", async () => {
      const idempotencyKey = "test-key-123";
      const result = { subscriptionId: "sub_123" };

      // Mock: successful insert
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const success = await storeIdempotencyResult(idempotencyKey, result);

      expect(success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("idempotency_keys");
    });

    it("should handle duplicate key insertion (unique constraint)", async () => {
      const idempotencyKey = "test-key-123";
      const result = { subscriptionId: "sub_123" };

      // Mock: unique constraint violation (23505)
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { code: "23505", message: "Duplicate key" },
        }),
      });

      const success = await storeIdempotencyResult(idempotencyKey, result);

      // Should return true (expected on concurrent requests)
      expect(success).toBe(true);
    });

    it("should return false on other database errors", async () => {
      const idempotencyKey = "test-key-123";
      const result = { subscriptionId: "sub_123" };

      // Mock: other database error
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { code: "PGRST301", message: "Database error" },
        }),
      });

      const success = await storeIdempotencyResult(idempotencyKey, result);

      expect(success).toBe(false);
    });
  });

  describe("executeWithIdempotency", () => {
    it("should execute operation on first call and store result", async () => {
      const idempotencyKey = "test-key-123";
      const operationResult = { subscriptionId: "sub_123" };
      const operation = vi.fn().mockResolvedValue(operationResult);

      // Mock: key doesn't exist, then successful insert
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        if (callCount === 0) {
          // First call: checkIdempotency
          callCount++;
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          } as unknown as ReturnType<typeof mockSupabase.from>;
        } else {
          // Second call: storeIdempotencyResult
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as unknown as ReturnType<typeof mockSupabase.from>;
        }
      });

      const result = await executeWithIdempotency(idempotencyKey, operation);

      expect(result).toEqual(operationResult);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should return cached result on second call", async () => {
      const idempotencyKey = "test-key-123";
      const cachedResult = { subscriptionId: "sub_123" };
      const operation = vi.fn().mockResolvedValue({ subscriptionId: "sub_456" });

      // Mock: key exists
      (mockSupabase.from as unknown as { mockReturnValue: (value: unknown) => unknown }).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { result: cachedResult, created_at: new Date().toISOString() },
              error: null,
            }),
          })),
        })),
      });

      const result = await executeWithIdempotency(idempotencyKey, operation);

      expect(result).toEqual(cachedResult);
      expect(operation).not.toHaveBeenCalled(); // Operation should not execute
    });

    it("should not fail if storing result fails", async () => {
      const idempotencyKey = "test-key-123";
      const operationResult = { subscriptionId: "sub_123" };
      const operation = vi.fn().mockResolvedValue(operationResult);

      // Mock: key doesn't exist, then insert fails
      let callCount = 0;
      (mockSupabase.from as unknown as { mockImplementation: (fn: () => unknown) => unknown }).mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          } as unknown as ReturnType<typeof mockSupabase.from>;
        } else {
          return {
            insert: vi.fn().mockRejectedValue(new Error("Storage failed")),
          } as unknown;
        }
      });

      // Should still return result even if storage fails
      const result = await executeWithIdempotency(idempotencyKey, operation);

      expect(result).toEqual(operationResult);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});

