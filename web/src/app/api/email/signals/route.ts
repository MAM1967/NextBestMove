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
        "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, person_id"
      )
      .eq("user_id", user.id)
      .gte("received_at", thirtyDaysAgo.toISOString())
      .order("received_at", { ascending: false })
      .limit(100);

    // Fetch relationship names for emails that have person_id
    const personIds = [
      ...new Set(
        (recentEmails || [])
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

    if (emailError) {
      console.error("Error fetching email signals:", emailError);
      return NextResponse.json(
        { error: "Failed to fetch email signals" },
        { status: 500 }
      );
    }

    // Extract signals
    const emailsWithAsks = (recentEmails || []).filter((e) => e.ask);
    const emailsWithOpenLoops = (recentEmails || []).filter(
      (e) => e.open_loops && e.open_loops.length > 0
    );

    // Get most recent high-priority emails
    const highPriorityEmails = (recentEmails || [])
      .filter((e) => e.priority === "high")
      .slice(0, 10);

    return NextResponse.json({
      totalEmails: recentEmails?.length || 0,
      emailsWithAsks: emailsWithAsks.length,
      emailsWithOpenLoops: emailsWithOpenLoops.length,
      recentHighPriority: highPriorityEmails.map((e) => ({
        id: e.id,
        subject: e.subject,
        snippet: e.snippet,
        receivedAt: e.received_at,
        topic: e.last_topic,
        ask: e.ask,
        relationshipName: e.person_id ? relationshipNames[e.person_id] || "Unknown" : "Unknown",
        relationshipId: e.person_id,
      })),
      recentOpenLoops: emailsWithOpenLoops.slice(0, 10).map((e) => ({
        id: e.id,
        subject: e.subject,
        snippet: e.snippet,
        receivedAt: e.received_at,
        openLoops: e.open_loops,
        relationshipName: e.person_id ? relationshipNames[e.person_id] || "Unknown" : "Unknown",
        relationshipId: e.person_id,
      })),
    });
  } catch (error) {
    console.error("Error fetching global signals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch global signals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

