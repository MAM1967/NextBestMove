import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to see what email data is stored for a relationship
 * GET /api/debug/email-data/[relationshipId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ relationshipId: string }> }
) {
  try {
    const { relationshipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get relationship details
    const { data: relationship, error: relError } = await supabase
      .from("leads")
      .select("id, name, email, url")
      .eq("id", relationshipId)
      .eq("user_id", user.id)
      .single();

    if (relError || !relationship) {
      return NextResponse.json(
        { error: "Relationship not found", details: relError },
        { status: 404 }
      );
    }

    // Get ALL email metadata for this relationship (no date limit)
    const { data: emails, error: emailError } = await supabase
      .from("email_metadata")
      .select("*")
      .eq("user_id", user.id)
      .eq("person_id", relationshipId)
      .order("received_at", { ascending: false })
      .limit(10);

    if (emailError) {
      return NextResponse.json(
        { error: "Failed to fetch emails", details: emailError },
        { status: 500 }
      );
    }

    // Also check for unmatched emails with this email hash
    const { hashEmailAddress } = await import("@/lib/email/utils");
    const emailHash = relationship.email ? hashEmailAddress(relationship.email) : null;
    
    let unmatchedEmails: any[] = [];
    if (emailHash) {
      const { data: unmatched } = await supabase
        .from("email_metadata")
        .select("id, subject, received_at, from_email_hash, person_id")
        .eq("user_id", user.id)
        .eq("from_email_hash", emailHash)
        .is("person_id", null)
        .order("received_at", { ascending: false })
        .limit(5);
      
      unmatchedEmails = unmatched || [];
    }

    return NextResponse.json({
      relationship: {
        id: relationship.id,
        name: relationship.name,
        email: relationship.email,
        url: relationship.url,
        emailHash: emailHash,
      },
      matchedEmails: emails || [],
      matchedCount: emails?.length || 0,
      unmatchedEmails: unmatchedEmails,
      unmatchedCount: unmatchedEmails.length,
      // Show what fields are populated in the most recent email
      mostRecentEmailFields: emails && emails.length > 0 ? {
        id: emails[0].id,
        subject: emails[0].subject,
        received_at: emails[0].received_at,
        has_thread_summary_1l: !!emails[0].thread_summary_1l,
        has_thread_summary_detail: !!emails[0].thread_summary_detail,
        has_topics_comprehensive: !!emails[0].topics_comprehensive,
        topics_comprehensive: emails[0].topics_comprehensive,
        has_asks_from_sender: !!emails[0].asks_from_sender,
        asks_from_sender: emails[0].asks_from_sender,
        has_suggested_next_actions: !!emails[0].suggested_next_actions,
        suggested_next_actions: emails[0].suggested_next_actions,
        has_attachments: !!emails[0].attachments,
        attachments: emails[0].attachments,
        has_links: !!emails[0].links,
        links: emails[0].links,
        has_relationship_signal: !!emails[0].relationship_signal,
        relationship_signal: emails[0].relationship_signal,
        sentiment: emails[0].sentiment,
        intent: emails[0].intent,
        // Legacy fields
        last_topic: emails[0].last_topic,
        ask: emails[0].ask,
      } : null,
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch debug data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

