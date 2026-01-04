import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests for GET /api/admin/cancellation-analytics
 *
 * These tests verify:
 * - Admin authentication is required
 * - Non-admin users are rejected (403)
 * - Unauthenticated requests are rejected (401)
 * - Aggregation logic correctly calculates breakdown by reason
 * - Date filtering works correctly
 * - Reason filtering works correctly
 * - Response format matches expected structure
 */

// Mock the admin auth module
vi.mock("@/lib/admin/auth", () => ({
  isAdmin: vi.fn(),
  getAdminClient: vi.fn(),
}));

// Mock the Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("GET /api/admin/cancellation-analytics", () => {
  let mockSupabase: SupabaseClient;
  let mockAdminClient: SupabaseClient;
  let mockIsAdmin: ReturnType<typeof vi.fn>;
  let mockGetAdminClient: ReturnType<typeof vi.fn>;
  let mockCreateClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    // Create mock Supabase clients
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    } as any;

    mockAdminClient = {
      from: vi.fn(),
    } as any;

    // Setup mocks - import after resetModules
    const adminAuthModule = await import("@/lib/admin/auth");
    mockIsAdmin = vi.mocked(adminAuthModule.isAdmin);
    mockGetAdminClient = vi.mocked(adminAuthModule.getAdminClient);

    const supabaseModule = await import("@/lib/supabase/server");
    mockCreateClient = vi.mocked(supabaseModule.createClient);

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetAdminClient.mockReturnValue(mockAdminClient);
  });

  it("should return 401 for unauthenticated requests", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { GET } = await import("@/app/api/admin/cancellation-analytics/route");
    const request = new Request("http://localhost/api/admin/cancellation-analytics");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 for non-admin users", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      },
      error: null,
    });

    mockIsAdmin.mockResolvedValue(false);

    const { GET } = await import("@/app/api/admin/cancellation-analytics/route");
    const request = new Request("http://localhost/api/admin/cancellation-analytics");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return aggregated breakdown for admin users", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
        },
      },
      error: null,
    });

    mockIsAdmin.mockResolvedValue(true);

    // Mock cancellation feedback data
    const mockFeedback = [
      {
        id: "1",
        user_id: "user-1",
        subscription_id: "sub-1",
        cancellation_reason: "too_expensive",
        additional_feedback: "Price is too high",
        created_at: "2025-01-01T00:00:00Z",
        users: {
          email: "user1@example.com",
          name: "User One",
        },
      },
      {
        id: "2",
        user_id: "user-2",
        subscription_id: "sub-2",
        cancellation_reason: "too_expensive",
        additional_feedback: null,
        created_at: "2025-01-02T00:00:00Z",
        users: {
          email: "user2@example.com",
          name: "User Two",
        },
      },
      {
        id: "3",
        user_id: "user-3",
        subscription_id: "sub-3",
        cancellation_reason: "not_using",
        additional_feedback: "Not using the product",
        created_at: "2025-01-03T00:00:00Z",
        users: {
          email: "user3@example.com",
          name: "User Three",
        },
      },
    ];

    // Mock the query builder chain - Supabase queries are thenable
    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Make the query builder thenable (Promise-like)
    Object.setPrototypeOf(queryBuilder, Promise.prototype);
    queryBuilder.then = vi.fn((resolve) => {
      return Promise.resolve({ data: mockFeedback, error: null }).then(resolve);
    });
    queryBuilder.catch = vi.fn((reject) => {
      return Promise.resolve({ data: mockFeedback, error: null }).catch(reject);
    });

    mockAdminClient.from = vi.fn().mockReturnValue(queryBuilder);

    const { GET } = await import("@/app/api/admin/cancellation-analytics/route");
    const request = new Request("http://localhost/api/admin/cancellation-analytics");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(3);
    expect(data.breakdown).toHaveLength(2);
    expect(data.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "too_expensive",
          count: 2,
          percentage: expect.closeTo(66.67, 1),
        }),
        expect.objectContaining({
          reason: "not_using",
          count: 1,
          percentage: expect.closeTo(33.33, 1),
        }),
      ])
    );
    expect(data.feedback).toHaveLength(3);
  });

  it("should apply date filters correctly", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
        },
      },
      error: null,
    });

    mockIsAdmin.mockResolvedValue(true);

    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    Object.setPrototypeOf(queryBuilder, Promise.prototype);
    queryBuilder.then = vi.fn((resolve) => {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    });
    queryBuilder.catch = vi.fn((reject) => {
      return Promise.resolve({ data: [], error: null }).catch(reject);
    });

    mockAdminClient.from = vi.fn().mockReturnValue(queryBuilder);

    const { GET } = await import("@/app/api/admin/cancellation-analytics/route");
    const request = new Request(
      "http://localhost/api/admin/cancellation-analytics?startDate=2025-01-01&endDate=2025-01-31"
    );

    await GET(request);

    expect(queryBuilder.gte).toHaveBeenCalledWith("created_at", "2025-01-01");
    expect(queryBuilder.lte).toHaveBeenCalledWith("created_at", "2025-01-31");
  });

  it("should apply reason filter correctly", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
        },
      },
      error: null,
    });

    mockIsAdmin.mockResolvedValue(true);

    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    Object.setPrototypeOf(queryBuilder, Promise.prototype);
    queryBuilder.then = vi.fn((resolve) => {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    });
    queryBuilder.catch = vi.fn((reject) => {
      return Promise.resolve({ data: [], error: null }).catch(reject);
    });

    mockAdminClient.from = vi.fn().mockReturnValue(queryBuilder);

    const { GET } = await import("@/app/api/admin/cancellation-analytics/route");
    const request = new Request(
      "http://localhost/api/admin/cancellation-analytics?reason=too_expensive"
    );

    await GET(request);

    expect(queryBuilder.eq).toHaveBeenCalledWith("cancellation_reason", "too_expensive");
  });
});

