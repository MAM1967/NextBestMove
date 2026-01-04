import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { extractSignalsWithAI } from "@/lib/email/ai-signals";
import { htmlToText } from "@/lib/email/html-to-text";

/**
 * Debug endpoint to test AI extraction on a specific email
 * GET /api/debug/email-extraction/[emailId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the email from database
    const { data: email, error: emailError } = await supabase
      .from("email_metadata")
      .select("*")
      .eq("id", emailId)
      .eq("user_id", user.id)
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        { error: "Email not found", details: emailError },
        { status: 404 }
      );
    }

    // Get user AI settings
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", user.id)
      .single();

    const userAiProvider = userProfile?.ai_provider || null;
    const userApiKeyEncrypted = userProfile?.ai_api_key_encrypted || null;
    const userModel = userProfile?.ai_model || null;

    // Prepare email text for AI
    const fullBodyText = email.full_body 
      ? htmlToText(email.full_body)
      : email.snippet || "";

    // Run AI extraction
    let aiExtraction: any = null;
    let extractionError: string | null = null;
    
    try {
      aiExtraction = await extractSignalsWithAI(
        email.subject || "",
        email.snippet || "",
        fullBodyText,
        undefined,
        userAiProvider,
        userApiKeyEncrypted,
        userModel
      );
    } catch (error) {
      extractionError = error instanceof Error ? error.message : "Unknown error";
      console.error("[Debug] AI extraction error:", error);
    }

    return NextResponse.json({
      email: {
        id: email.id,
        subject: email.subject,
        snippet: email.snippet,
        received_at: email.received_at,
        person_id: email.person_id,
        // Show body info
        has_full_body: !!email.full_body,
        full_body_length: email.full_body?.length || 0,
        full_body_preview: email.full_body 
          ? email.full_body.substring(0, 500) + (email.full_body.length > 500 ? "..." : "")
          : null,
        full_body_text_preview: fullBodyText.substring(0, 500) + (fullBodyText.length > 500 ? "..." : ""),
        full_body_text_length: fullBodyText.length,
        // Current database values
        current_thread_summary_1l: email.thread_summary_1l,
        current_topics_comprehensive: email.topics_comprehensive,
        current_asks_from_sender: email.asks_from_sender,
        current_suggested_next_actions: email.suggested_next_actions,
        current_relationship_signal: email.relationship_signal,
      },
      aiExtraction: aiExtraction ? {
        // Legacy fields
        topic: aiExtraction.topic,
        asks: aiExtraction.asks,
        openLoops: aiExtraction.openLoops,
        priority: aiExtraction.priority,
        sentiment: aiExtraction.sentiment,
        intent: aiExtraction.intent,
        recommendedAction: aiExtraction.recommendedAction,
        // Comprehensive fields
        thread_summary_1l: aiExtraction.thread_summary_1l,
        thread_summary_detail: aiExtraction.thread_summary_detail,
        primary_category: aiExtraction.primary_category,
        secondary_categories: aiExtraction.secondary_categories,
        topics: aiExtraction.topics,
        proposed_tiers: aiExtraction.proposed_tiers,
        asks_from_sender: aiExtraction.asks_from_sender,
        value_to_capture: aiExtraction.value_to_capture,
        suggested_next_actions: aiExtraction.suggested_next_actions,
        attachments: aiExtraction.attachments,
        links: aiExtraction.links,
        relationship_signal: aiExtraction.relationship_signal,
      } : null,
      extractionError,
      aiSettings: {
        provider: userAiProvider,
        hasApiKey: !!userApiKeyEncrypted,
        model: userModel,
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to debug email extraction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

