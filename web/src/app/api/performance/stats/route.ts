import { NextResponse } from "next/server";
import { getResponseTimeStats } from "@/lib/middleware/response-time";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/performance/stats
 * 
 * Returns performance statistics for API endpoints.
 * Requires authentication.
 * 
 * This endpoint provides:
 * - Response time statistics (p50, p95, p99) per endpoint
 * - Request counts
 * - Average, min, max response times
 * 
 * Useful for monitoring and debugging performance issues.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get response time statistics
    const stats = getResponseTimeStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      note: "Statistics reset on server restart. Only tracks last 100 requests per endpoint.",
    });
  } catch (error) {
    console.error("Error fetching performance stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

