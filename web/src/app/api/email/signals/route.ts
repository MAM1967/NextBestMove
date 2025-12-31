import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/email/signals
 * 
 * Returns a global rollup of email signals across all relationships.
 * Shows recent emails, open loops, and pending asks.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent email metadata (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEmails, error: emailError } = await supabase
      .from("email_metadata")
      .select(
        "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, sentiment, intent, person_id"
      )
      .eq("user_id", user.id)
      .not("person_id", "is", null) // Only include emails from tracked relationships
      .gte("received_at", thirtyDaysAgo.toISOString())
      .order("received_at", { ascending: false })
      .limit(100);

    // Check for error immediately after query
    if (emailError) {
      console.error("Error fetching email signals:", emailError);
      console.error("Error details:", {
        message: emailError.message,
        code: emailError.code,
        details: emailError.details,
        hint: emailError.hint,
      });
      // Return empty signals array instead of error if table doesn't exist
      // This allows the page to load gracefully even if email integration isn't set up
      if (
        emailError.code === "PGRST205" || // Table not found in schema cache
        emailError.code === "42P01" || // Relation does not exist
        emailError.message?.includes("does not exist") ||
        emailError.message?.includes("Could not find the table")
      ) {
        console.warn("email_metadata table does not exist, returning empty signals");
        return NextResponse.json({
          signals: [],
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch email signals", details: emailError.message },
        { status: 500 }
      );
    }

    // If no emails, return empty result
    if (!recentEmails || recentEmails.length === 0) {
      return NextResponse.json({
        signals: [],
      });
    }

    // Fetch relationship names for emails that have person_id
    const personIds = [
      ...new Set(
        recentEmails
          .map((e) => e.person_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    let relationshipNames: Record<string, string> = {};
    if (personIds.length > 0) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name")
        .eq("user_id", user.id)
        .in("id", personIds);

      if (leads) {
        relationshipNames = Object.fromEntries(
          leads.map((lead) => [lead.id, lead.name])
        );
      }
    }

    // Group emails by relationship_id for signals format
    const signalsByRelationship = new Map<string, any>();

    for (const email of recentEmails) {
      // person_id is guaranteed to be non-null due to filter above
      if (!email.person_id) {
        continue; // Skip any emails without relationship (shouldn't happen with filter, but safety check)
      }
      
      const relationshipId = email.person_id;
      
      if (!signalsByRelationship.has(relationshipId)) {
        signalsByRelationship.set(relationshipId, {
          relationship_id: email.person_id,
          relationship_name: relationshipNames[email.person_id] || "Unknown",
          last_email_received: email.received_at,
          unread_count: 0, // TODO: Calculate from email_metadata if we track read status
          recent_topics: [] as string[],
          recent_asks: [] as string[],
          recent_open_loops: [] as string[],
          recent_labels: [] as string[],
        });
      }

      const signal = signalsByRelationship.get(relationshipId)!;
      
      // Update last email received if this is more recent
      // Also update sentiment and intent from most recent email
      if (new Date(email.received_at) > new Date(signal.last_email_received || 0)) {
        signal.last_email_received = email.received_at;
        signal.sentiment = email.sentiment || null;
        signal.intent = email.intent || null;
      }

      // Add topic if present
      if (email.last_topic && !signal.recent_topics.includes(email.last_topic)) {
        signal.recent_topics.push(email.last_topic);
      }

      // Add ask if present
      if (email.ask && !signal.recent_asks.includes(email.ask)) {
        signal.recent_asks.push(email.ask);
      }

      // Add open loops if present
      if (email.open_loops && Array.isArray(email.open_loops)) {
        for (const loop of email.open_loops) {
          if (typeof loop === "string" && !signal.recent_open_loops.includes(loop)) {
            signal.recent_open_loops.push(loop);
          }
        }
      }
    }

    // Convert map to array and sort by last_email_received
    const signals = Array.from(signalsByRelationship.values()).sort((a, b) => {
      const dateA = new Date(a.last_email_received || 0).getTime();
      const dateB = new Date(b.last_email_received || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    return NextResponse.json({
      signals,
    });
  } catch (error) {
    console.error("Error fetching global signals:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // If it's a table not found error or similar, return empty array instead of error
    if (error instanceof Error && (
      error.message.includes("does not exist") ||
      error.message.includes("relation") ||
      error.message.includes("42P01")
    )) {
      console.warn("Table may not exist, returning empty signals");
      return NextResponse.json({
        signals: [],
      });
    }
    
    return NextResponse.json(
      {
        error: "Failed to fetch global signals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

