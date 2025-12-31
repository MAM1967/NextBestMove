import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ingestEmailMetadata } from "@/lib/email/ingestion";

/**
 * POST /api/email/sync
 * 
 * Triggers email metadata ingestion for the authenticated user.
 * Fetches recent emails and extracts signals (topics, asks, open loops).
 */
export async function POST(request: Request) {
  try {
    console.log("[Email Sync] Starting email sync request");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Email Sync] Unauthorized - no user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Email Sync] User authenticated: ${user.id}`);

    // Check if user has any active email connections
    const { data: connections, error: connError } = await supabase
      .from("email_connections")
      .select("provider, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (connError) {
      console.error("[Email Sync] Error checking connections:", connError);
    }

    console.log(`[Email Sync] Found ${connections?.length || 0} active email connections:`, connections?.map(c => c.provider));

    if (!connections || connections.length === 0) {
      console.log("[Email Sync] No active email connections found");
      return NextResponse.json(
        { error: "No active email connections found" },
        { status: 400 }
      );
    }

    console.log("[Email Sync] Starting email metadata ingestion");
    // Ingest email metadata
    const results = await ingestEmailMetadata(user.id);
    console.log(`[Email Sync] Ingestion complete - Gmail: ${results.gmail}, Outlook: ${results.outlook}`);

    // Backfill: Match existing emails to relationships
    console.log("[Email Sync] Starting email backfill");
    const { backfillEmailMetadata } = await import("@/lib/email/ingestion");
    const backfilledCount = await backfillEmailMetadata(user.id);
    console.log(`[Email Sync] Backfill complete - matched ${backfilledCount} emails`);

    return NextResponse.json({
      success: true,
      ingested: results,
      backfilled: backfilledCount,
      message: `Ingested ${results.gmail + results.outlook} email messages, matched ${backfilledCount} existing emails to relationships`,
    });
  } catch (error) {
    console.error("[Email Sync] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync email metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}





