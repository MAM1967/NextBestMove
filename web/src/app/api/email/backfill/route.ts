import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { backfillEmailMetadata } from "@/lib/email/ingestion";

/**
 * POST /api/email/backfill
 * 
 * Manually trigger email backfill to match existing emails to relationships.
 * Useful for debugging or when relationships are created/updated.
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

    // Run backfill
    const matchedCount = await backfillEmailMetadata(user.id);

    return NextResponse.json({
      success: true,
      matched: matchedCount,
      message: `Matched ${matchedCount} existing emails to relationships`,
    });
  } catch (error) {
    console.error("Email backfill error:", error);
    return NextResponse.json(
      {
        error: "Failed to backfill email metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

