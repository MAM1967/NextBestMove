import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkPinLimit } from "@/lib/billing/subscription";

/**
 * GET /api/billing/check-pin-limit
 * 
 * Check if user can add more pins based on their plan limits
 * Returns: { canAdd: boolean, currentCount: number, limit: number, plan: string }
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

    const limitInfo = await checkPinLimit(user.id);

    return NextResponse.json(limitInfo);
  } catch (error) {
    console.error("Error checking pin limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

