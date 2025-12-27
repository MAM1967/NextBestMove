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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has any active email connections
    const { data: connections } = await supabase
      .from("email_connections")
      .select("provider")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: "No active email connections found" },
        { status: 400 }
      );
    }

    // Ingest email metadata
    const results = await ingestEmailMetadata(user.id);

    return NextResponse.json({
      success: true,
      ingested: results,
      message: `Ingested ${results.gmail + results.outlook} email messages`,
    });
  } catch (error) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync email metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}




