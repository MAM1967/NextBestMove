import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/email/signals/relationship/[id]
 * 
 * Returns email signals for a specific relationship.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: relationshipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the relationship belongs to the user
    const { data: relationship } = await supabase
      .from("leads")
      .select("id, name")
      .eq("id", relationshipId)
      .eq("user_id", user.id)
      .single();

    if (!relationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    // Get email metadata for this relationship (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Debug: Check if relationship has email set
    const { data: relationshipDetails } = await supabase
      .from("leads")
      .select("id, name, email, url")
      .eq("id", relationshipId)
      .single();
    
    if (relationshipDetails) {
      console.log(`[Email Signals Debug] Relationship: ${relationshipDetails.name}, email: ${relationshipDetails.email}, url: ${relationshipDetails.url}`);
    }

    const { data: emails, error: emailError } = await supabase
      .from("email_metadata")
      .select(
        "id, subject, snippet, received_at, last_topic, ask, open_loops, priority, person_id, from_email_hash, sentiment, intent, recommended_action_type, recommended_action_description, recommended_due_date"
      )
      .eq("user_id", user.id)
      .eq("person_id", relationshipId)
      .gte("received_at", thirtyDaysAgo.toISOString())
      .order("received_at", { ascending: false })
      .limit(50);

    // Debug: Check unmatched emails for this user
    if (!emails || emails.length === 0) {
      const { data: unmatchedCount } = await supabase
        .from("email_metadata")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("person_id", null);
      
      console.log(`[Email Signals Debug] No emails found for relationship ${relationshipId}. Total unmatched emails for user: ${unmatchedCount || 0}`);
    } else {
      console.log(`[Email Signals Debug] Found ${emails.length} emails for relationship ${relationshipId}`);
    }

    if (emailError) {
      console.error("Error fetching relationship email signals:", emailError);
      // Return empty array if table doesn't exist (graceful degradation)
      if (
        emailError.code === "PGRST205" ||
        emailError.code === "42P01" ||
        emailError.message?.includes("does not exist")
      ) {
        return NextResponse.json({
          relationship_id: relationshipId,
          relationship_name: relationship.name,
          emails: [],
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch email signals", details: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      relationship_id: relationshipId,
      relationship_name: relationship.name,
      emails: emails || [],
    });
  } catch (error) {
    console.error("Error fetching relationship signals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch relationship signals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

