import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reprocessEmailSignals } from "@/lib/email/reprocess";

/**
 * POST /api/email/reprocess
 * 
 * Reprocess existing emails with comprehensive AI extraction.
 * Useful when comprehensive AI fields were added after emails were already ingested.
 * 
 * Query params:
 * - relationshipId (optional): Only reprocess emails for a specific relationship
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

    // Get optional relationshipId from query params
    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get("relationshipId") || undefined;

    // Reprocess emails
    const reprocessedCount = await reprocessEmailSignals(user.id, relationshipId);

    return NextResponse.json({
      success: true,
      reprocessed: reprocessedCount,
      message: `Reprocessed ${reprocessedCount} emails with comprehensive AI extraction`,
    });
  } catch (error) {
    console.error("Email reprocess error:", error);
    return NextResponse.json(
      {
        error: "Failed to reprocess email signals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

