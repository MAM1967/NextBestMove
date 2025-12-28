import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { extractInteractions } from "@/lib/ai/interaction-extraction";

/**
 * POST /api/leads/[id]/meeting-notes
 * 
 * Upload or paste meeting notes/transcript for a relationship.
 * Extracts action items and insights, creates actions, and stores insights.
 */
export async function POST(
  request: Request,
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

    // Verify relationship belongs to user
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, notes, user_id")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      if (leadError?.code === "PGRST116") {
        return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
      }
      console.error("Error fetching relationship:", leadError);
      return NextResponse.json(
        { error: "Failed to fetch relationship" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Get user's AI settings for extraction
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, openai_api_key_encrypted, ai_model")
      .eq("id", user.id)
      .single();

    // Create meeting note record
    const { data: meetingNote, error: createError } = await supabase
      .from("meeting_notes")
      .insert({
        user_id: user.id,
        lead_id: leadId,
        content: content.trim(),
        extraction_status: "processing",
      })
      .select()
      .single();

    if (createError || !meetingNote) {
      console.error("Error creating meeting note:", createError);
      return NextResponse.json(
        { error: "Failed to create meeting note" },
        { status: 500 }
      );
    }

    // Extract interactions asynchronously (don't await, return immediately)
    // This allows the UI to show that processing has started
    extractAndPersistInteractions(
      supabase,
      meetingNote.id,
      content.trim(),
      lead.name,
      user.id,
      leadId,
      lead.notes || "",
      userProfile?.ai_provider || null,
      userProfile?.openai_api_key_encrypted || null,
      userProfile?.ai_model || null
    ).catch((error) => {
      console.error("Error in async extraction:", error);
      // Update meeting note status to failed
      supabase
        .from("meeting_notes")
        .update({
          extraction_status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", meetingNote.id)
        .then(() => {
          console.log("Updated meeting note status to failed");
        });
    });

    // Return immediately with the meeting note (processing status)
    return NextResponse.json(
      {
        meetingNote: {
          ...meetingNote,
          extraction_status: "processing",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Extract interactions and persist to database
 * Called asynchronously after meeting note is created
 */
async function extractAndPersistInteractions(
  supabase: any,
  meetingNoteId: string,
  content: string,
  relationshipName: string,
  userId: string,
  leadId: string,
  existingLeadNotes: string,
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null,
  userModel?: string | null
) {
  try {
    // Extract interactions using AI
    const extractionResult = await extractInteractions(
      content,
      relationshipName,
      userAiProvider,
      userApiKeyEncrypted,
      userModel
    );

    const today = new Date().toISOString().split("T")[0];

    // Create actions from extracted action items
    const createdActionIds: string[] = [];
    for (const actionItem of extractionResult.actionItems) {
      // Calculate due date: use extracted date if provided, otherwise default to 3 days from now for POST_CALL, 7 days for others
      let dueDate = actionItem.due_date || today;
      if (!actionItem.due_date) {
        const defaultDays = actionItem.action_type === "POST_CALL" ? 3 : 7;
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + defaultDays);
        dueDate = defaultDate.toISOString().split("T")[0];
      }

      const { data: action, error: actionError } = await supabase
        .from("actions")
        .insert({
          user_id: userId,
          person_id: leadId,
          action_type: actionItem.action_type,
          state: "NEW",
          description: actionItem.description,
          due_date: dueDate,
          notes: actionItem.notes || null,
          auto_created: true,
          meeting_note_id: meetingNoteId,
        })
        .select("id")
        .single();

      if (!actionError && action) {
        createdActionIds.push(action.id);
      } else {
        console.error("Error creating action:", actionError);
      }
    }

    // Store insights by appending to lead notes
    let updatedNotes = existingLeadNotes;
    if (extractionResult.insights.length > 0) {
      const insightsText = extractionResult.insights
        .map((insight) => `• ${insight.text}`)
        .join("\n");
      const insightsSection = `\n\n---\nMeeting Insights (${new Date().toLocaleDateString()}):\n${insightsText}`;
      updatedNotes = (existingLeadNotes || "") + insightsSection;

      // Update lead notes
      await supabase
        .from("leads")
        .update({ notes: updatedNotes })
        .eq("id", leadId);
    }

    // Format insights as JSON string for storage
    const insightsText = JSON.stringify(extractionResult.insights);

    // Determine extraction confidence from overall confidence
    const extractionConfidence = extractionResult.overallConfidence;

    // Update meeting note with extraction results
    const { error: updateError } = await supabase
      .from("meeting_notes")
      .update({
        extraction_status: extractionResult.needsReview ? "needs_review" : "completed",
        extracted_insights: insightsText,
        extraction_confidence: extractionConfidence,
        extracted_at: new Date().toISOString(),
      })
      .eq("id", meetingNoteId);

    if (updateError) {
      console.error("Error updating meeting note:", updateError);
    }

    console.log(
      `Extraction completed for meeting note ${meetingNoteId}: ${extractionResult.actionItems.length} actions, ${extractionResult.insights.length} insights`
    );
  } catch (error) {
    console.error("Error in extractAndPersistInteractions:", error);
    throw error;
  }
}

/**
 * GET /api/leads/[id]/meeting-notes
 * 
 * Get all meeting notes for a relationship
 */
export async function GET(
  request: Request,
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

    // Verify relationship belongs to user
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      if (leadError?.code === "PGRST116") {
        return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch relationship" },
        { status: 500 }
      );
    }

    // Get meeting notes for this relationship
    const { data: meetingNotes, error: notesError } = await supabase
      .from("meeting_notes")
      .select("*")
      .eq("lead_id", leadId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Error fetching meeting notes:", notesError);
      return NextResponse.json(
        { error: "Failed to fetch meeting notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetingNotes: meetingNotes || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




