import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserTier } from "@/lib/billing/tier";

/**
 * GET /api/billing/tier
 * 
 * Returns the current user's tier (free | standard | premium).
 * Uses cached tier from users.tier field.
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

    return NextResponse.json({ tier });
  } catch (error) {
    console.error("Error fetching tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}





