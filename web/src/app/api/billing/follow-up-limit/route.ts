import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/billing/tier";
import { checkFollowUpLimit } from "@/lib/billing/follow-up-limits";

/**
 * GET /api/billing/follow-up-limit
 * Get current follow-up limit status for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserTier(supabase, user.id);
    const limitCheck = await checkFollowUpLimit(supabase, user.id, tier);

    return NextResponse.json({
      currentCount: limitCheck.currentCount,
      limit: limitCheck.limit,
      canCreate: limitCheck.canCreate,
      message: limitCheck.message,
    });
  } catch (error) {
    console.error("Error fetching follow-up limit:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow-up limit" },
      { status: 500 }
    );
  }
}

