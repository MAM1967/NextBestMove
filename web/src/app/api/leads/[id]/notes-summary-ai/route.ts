import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getOpenAIClientForUser } from "@/lib/ai/openai";

/**
 * GET /api/leads/[id]/notes-summary-ai
 * 
 * Uses AI to organize notes (from onboarding, emails, and merged conversations)
 * into usable topics, including:
 * - Last discussion date for each topic
 * - Associated action items (pending and overdue)
 * - Organized by topic for easy reference
 * 
 * NEX-50: Notes Summary AI Organization
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Fetch relationship
    const { data: relationship, error: relationshipError } = await supabase
      .from("leads")
      .select("id, name, notes, created_at")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (relationshipError || !relationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    // Fetch all notes sources
    const notesSources: string[] = [];

    // 1. Onboarding notes (from leads.notes)
    if (relationship.notes) {
      notesSources.push(`Onboarding Notes: ${relationship.notes}`);
    }

    // 2. Email metadata (from email_metadata)
    const { data: emails } = await supabase
      .from("email_metadata")
      .select("subject, snippet, full_body, received_at, last_topic")
      .eq("user_id", user.id)
      .eq("person_id", leadId)
      .order("received_at", { ascending: false })
      .limit(20);

    if (emails && emails.length > 0) {
      emails.forEach((email) => {
        if (email.full_body || email.snippet) {
          notesSources.push(
            `Email from ${new Date(email.received_at).toLocaleDateString()}: ${email.subject || "No subject"}\n${email.full_body || email.snippet || ""}`
          );
        }
        if (email.last_topic) {
          notesSources.push(`Email Topic: ${email.last_topic}`);
        }
      });
    }

    // 3. Meeting notes (from meeting_notes if table exists)
    // Note: This assumes a meeting_notes table exists. If not, we'll skip this.
    try {
      const { data: meetingNotes } = await supabase
        .from("meeting_notes")
        .select("notes, created_at")
        .eq("user_id", user.id)
        .eq("person_id", leadId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (meetingNotes && meetingNotes.length > 0) {
        meetingNotes.forEach((note) => {
          notesSources.push(
            `Meeting Notes from ${new Date(note.created_at).toLocaleDateString()}: ${note.notes}`
          );
        });
      }
    } catch (error) {
      // Table might not exist, that's okay
      console.log("meeting_notes table not found, skipping");
    }

    // 4. Action notes (from actions.notes)
    const { data: actions } = await supabase
      .from("actions")
      .select("id, notes, created_at, completed_at, action_type, due_date, state")
      .eq("user_id", user.id)
      .eq("person_id", leadId)
      .not("notes", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (actions && actions.length > 0) {
      actions.forEach((action) => {
        if (action.notes) {
          notesSources.push(
            `Action Note (${action.action_type}) from ${new Date(action.created_at).toLocaleDateString()}: ${action.notes}`
          );
        }
      });
    }

    // Combine all notes
    const combinedNotes = notesSources.join("\n\n");

    if (!combinedNotes.trim()) {
      return NextResponse.json({
        organizedTopics: [],
        message: "No notes found to organize",
      });
    }

    // Fetch user AI settings
    const { data: userAiSettings } = await supabase
      .from("user_ai_settings")
      .select("provider, api_key_encrypted, model, temperature")
      .eq("user_id", user.id)
      .single();

    // Use AI to organize notes into topics
    const aiPrompt = `You are organizing relationship notes into actionable topics. 

Given the following notes about ${relationship.name}, organize them into distinct topics. For each topic, identify:
1. The topic name (be specific, e.g., "Product Demo Discussion", "Pricing Negotiation", "Technical Requirements")
2. The last discussion date (when this topic was last mentioned)
3. Any pending or overdue action items related to this topic
4. A brief summary of what was discussed

Notes to organize:
${combinedNotes}

Return a JSON object with a "topics" array. Each topic should have:
- topic: string
- last_discussion_date: ISO date string (or null if not found)
- pending_actions: array of action descriptions
- overdue_actions: array of action descriptions  
- summary: string (2-3 sentences)

Format: {"topics": [...]}`;

    try {
      // Get OpenAI client
      const { getOpenAIClientForUser } = await import("@/lib/ai/openai");
      const client = getOpenAIClientForUser(
        userAiSettings?.provider || "system",
        userAiSettings?.api_key_encrypted || null
      );

      if (!client) {
        throw new Error("OpenAI client not available");
      }

      const model = userAiSettings?.model || "gpt-4o-mini";
      const temperature = userAiSettings?.temperature || 0.3;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that organizes relationship notes into actionable topics. Return only valid JSON, no markdown formatting.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        max_tokens: 2000,
        temperature,
        response_format: { type: "json_object" },
      });

      const aiResponse = response.choices[0]?.message?.content?.trim() || "{}";

      // Parse AI response
      let organizedTopics: any[] = [];
      try {
        const parsed = JSON.parse(aiResponse);
        // Handle both {topics: [...]} and [...] formats
        if (parsed.topics && Array.isArray(parsed.topics)) {
          organizedTopics = parsed.topics;
        } else if (Array.isArray(parsed)) {
          organizedTopics = parsed;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        // Fallback: create a single topic with all notes
        organizedTopics = [
          {
            topic: "General Notes",
            last_discussion_date: relationship.created_at,
            pending_actions: [],
            overdue_actions: [],
            summary: "All notes combined",
          },
        ];
      }

      // Fetch actual pending and overdue actions to enrich the response
      const now = new Date();
      const pendingActions = (actions || []).filter(
        (a) => ["NEW", "SENT", "SNOOZED"].includes(a.state) && new Date(a.due_date) >= now
      );
      const overdueActions = (actions || []).filter(
        (a) => ["NEW", "SENT", "SNOOZED"].includes(a.state) && new Date(a.due_date) < now
      );

      // Enrich topics with actual action data
      organizedTopics = organizedTopics.map((topic) => ({
        ...topic,
        pending_actions: pendingActions
          .filter((a) => a.notes?.toLowerCase().includes(topic.topic.toLowerCase()))
          .map((a) => ({
            id: a.id,
            description: a.notes || `${a.action_type} due ${a.due_date}`,
            due_date: a.due_date,
          })),
        overdue_actions: overdueActions
          .filter((a) => a.notes?.toLowerCase().includes(topic.topic.toLowerCase()))
          .map((a) => ({
            id: a.id,
            description: a.notes || `${a.action_type} due ${a.due_date}`,
            due_date: a.due_date,
          })),
      }));

      return NextResponse.json({
        organizedTopics,
        totalTopics: organizedTopics.length,
        totalNotes: notesSources.length,
      });
    } catch (aiError) {
      console.error("Error calling AI for notes organization:", aiError);
      // Fallback: return basic organization
      return NextResponse.json({
        organizedTopics: [
          {
            topic: "All Notes",
            last_discussion_date: relationship.created_at,
            pending_actions: [],
            overdue_actions: [],
            summary: "Combined notes from all sources",
          },
        ],
        error: "AI organization failed, returning basic structure",
      });
    }
  } catch (error) {
    console.error("Error in notes-summary-ai endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

