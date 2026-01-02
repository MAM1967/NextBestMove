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
      .select("id, url, email, name")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Fetch email metadata for this relationship using person_id
    // This is more reliable than matching by email hash since we now store person_id
    const { data: emailMetadata, error: metadataError } = await supabase
      .from("email_metadata")
      .select(
        "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, labels, sentiment, intent, recommended_action_type, recommended_action_description, recommended_due_date, thread_summary_1l, thread_summary_detail, primary_category, secondary_categories, topics, proposed_tiers, asks_from_sender, value_to_capture, suggested_next_actions, attachments, links, relationship_signal"
      )
      .eq("user_id", user.id)
      .eq("person_id", leadId)
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
      // Comprehensive signal fields
      thread_summary_1l: meta.thread_summary_1l,
      thread_summary_detail: meta.thread_summary_detail,
      primary_category: meta.primary_category,
      secondary_categories: meta.secondary_categories,
      topics: meta.topics,
      asks_from_sender: meta.asks_from_sender,
      suggested_next_actions: meta.suggested_next_actions,
      attachments: meta.attachments,
      links: meta.links,
      relationship_signal: meta.relationship_signal,
      sentiment: meta.sentiment,
      intent: meta.intent,
      recommended_action_type: meta.recommended_action_type,
      recommended_action_description: meta.recommended_action_description,
      recommended_due_date: meta.recommended_due_date,
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





