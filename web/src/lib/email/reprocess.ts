import { createAdminClient } from "@/lib/supabase/admin";
import { extractSignalsWithAI } from "./ai-signals";
import { htmlToText } from "./html-to-text";

/**
 * Reprocess existing email metadata with comprehensive AI extraction
 * This is useful when:
 * - Comprehensive AI fields were added after emails were already ingested
 * - AI extraction logic was improved and existing emails need updating
 * 
 * @param userId - User ID
 * @param relationshipId - Optional: Only reprocess emails for a specific relationship
 * @returns Number of emails reprocessed
 */
export async function reprocessEmailSignals(
  userId: string,
  relationshipId?: string
): Promise<number> {
  const supabase = createAdminClient();
  let reprocessedCount = 0;

  try {
    // Get user AI settings
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", userId)
      .single();

    const userAiProvider = userProfile?.ai_provider || null;
    const userApiKeyEncrypted = userProfile?.ai_api_key_encrypted || null;
    const userModel = userProfile?.ai_model || null;

    // Build query for emails that need reprocessing
    // Only reprocess emails that are missing comprehensive fields
    let query = supabase
      .from("email_metadata")
      .select("id, subject, snippet, full_body, person_id")
      .eq("user_id", userId)
      .is("thread_summary_1l", null); // Only reprocess emails missing comprehensive fields

    if (relationshipId) {
      query = query.eq("person_id", relationshipId);
    }

    const { data: emails, error: emailsError } = await query.limit(100); // Process in batches

    if (emailsError) {
      console.error("[Email Reprocess] Error fetching emails:", emailsError);
      throw emailsError;
    }

    if (!emails || emails.length === 0) {
      console.log("[Email Reprocess] No emails found that need reprocessing");
      return 0;
    }

    console.log(`[Email Reprocess] Reprocessing ${emails.length} emails for user ${userId}`);

    for (const email of emails) {
      try {
        // Extract signals using AI
        const fullBodyText = email.full_body 
          ? htmlToText(email.full_body)
          : email.snippet || "";

        const signals = await extractSignalsWithAI(
          email.subject || "",
          email.snippet || "",
          fullBodyText,
          undefined,
          userAiProvider,
          userApiKeyEncrypted,
          userModel
        );

        // Update email metadata with comprehensive fields
        const { error: updateError } = await supabase
          .from("email_metadata")
          .update({
            // Comprehensive signal fields
            thread_summary_1l: signals.thread_summary_1l,
            thread_summary_detail: signals.thread_summary_detail,
            primary_category: signals.primary_category,
            secondary_categories: signals.secondary_categories,
            topics_comprehensive: signals.topics,
            proposed_tiers: signals.proposed_tiers || null,
            asks_from_sender: signals.asks_from_sender,
            value_to_capture: signals.value_to_capture,
            suggested_next_actions: signals.suggested_next_actions,
            attachments: signals.attachments || null,
            links: signals.links || null,
            relationship_signal: signals.relationship_signal || null,
            // Also update legacy fields if they're missing
            sentiment: signals.sentiment || null,
            intent: signals.intent || null,
            recommended_action_type: signals.recommendedAction?.action_type || null,
            recommended_action_description: signals.recommendedAction?.description || null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        if (updateError) {
          console.error(`[Email Reprocess] Error updating email ${email.id}:`, updateError);
        } else {
          reprocessedCount++;
          console.log(`[Email Reprocess] ✅ Reprocessed email ${email.id}: "${email.subject}"`);
        }
      } catch (error) {
        console.error(`[Email Reprocess] Error reprocessing email ${email.id}:`, error);
        // Continue with next email even if one fails
      }
    }

    console.log(`[Email Reprocess] Complete - Reprocessed ${reprocessedCount} emails`);
    return reprocessedCount;
  } catch (error) {
    console.error("[Email Reprocess] Error reprocessing email signals:", error);
    throw error;
  }
}

