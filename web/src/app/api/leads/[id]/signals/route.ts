import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hashEmailAddress, extractEmailAddress } from "@/lib/email/utils";

/**
 * GET /api/leads/[id]/signals
 * 
 * Returns email signals for a specific relationship (lead).
 * Matches emails by hashed email addresses.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, url, name")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Extract email from lead URL if it's a mailto: link
    let emailHash: string | null = null;
    if (lead.url.startsWith("mailto:")) {
      const email = extractEmailAddress(lead.url.substring(7));
      emailHash = hashEmailAddress(email);
    }

    if (!emailHash) {
      // No email to match, return empty signals
      return NextResponse.json({
        signals: [],
        total: 0,
      });
    }

    // Fetch email metadata for this relationship
    const { data: emailMetadata, error: metadataError } = await supabase
      .from("email_metadata")
      .select(
        "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, labels"
      )
      .eq("user_id", user.id)
      .eq("from_email_hash", emailHash)
      .order("received_at", { ascending: false })
      .limit(50);

    if (metadataError) {
      console.error("Error fetching email metadata:", metadataError);
      return NextResponse.json(
        { error: "Failed to fetch email signals" },
        { status: 500 }
      );
    }

    // Group signals by thread/conversation
    const signals = (emailMetadata || []).map((meta) => ({
      id: meta.id,
      subject: meta.subject,
      snippet: meta.snippet,
      receivedAt: meta.received_at,
      topic: meta.last_topic,
      ask: meta.ask,
      openLoops: meta.open_loops || [],
      priority: meta.priority,
      labels: meta.labels || [],
    }));

    return NextResponse.json({
      signals,
      total: signals.length,
    });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch signals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}






