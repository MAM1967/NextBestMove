import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/calendar/cache";

/**
 * POST /api/calendar/refresh-cache
 * 
 * Invalidates the free/busy cache for the authenticated user.
 * Optionally accepts a date query param to invalidate a specific date.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // Invalidate cache
    invalidateCache(user.id, date || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cache invalidation error:", error);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}

