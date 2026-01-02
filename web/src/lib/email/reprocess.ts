import { createAdminClient } from "@/lib/supabase/admin";
import { extractSignalsWithAI } from "./ai-signals";
import { htmlToText } from "./html-to-text";
import { fetchGmailMessage, extractGmailMetadata } from "./gmail";
import { fetchOutlookMessage, extractOutlookMetadata } from "./outlook";

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
      .select("id, subject, snippet, full_body, person_id, message_id, email_connection_id")
      .eq("user_id", userId)
      .is("thread_summary_1l", null); // Only reprocess emails missing comprehensive fields

    if (relationshipId) {
      query = query.eq("person_id", relationshipId);
    }

    // Also get email connection info to know which provider to use
    const { data: emails, error: emailsError } = await query
      .limit(100); // Process in batches

    if (emailsError) {
      console.error("[Email Reprocess] Error fetching emails:", emailsError);
      throw emailsError;
    }

    if (!emails || emails.length === 0) {
      console.log("[Email Reprocess] No emails found that need reprocessing");
      return 0;
    }

    // Get email connection info to determine provider
    const { data: emailConnections } = await supabase
      .from("email_connections")
      .select("id, provider")
      .eq("user_id", userId)
      .eq("status", "active");

    const connectionMap = new Map(
      emailConnections?.map((conn) => [conn.id, conn.provider]) || []
    );

    console.log(`[Email Reprocess] Reprocessing ${emails.length} emails for user ${userId}`);

    for (const email of emails) {
      try {
        let fullBodyText = email.full_body 
          ? htmlToText(email.full_body)
          : email.snippet || "";

        // If full_body is missing or too short (likely was ingested with format=metadata),
        // re-fetch the full email from Gmail/Outlook
        if (!email.full_body || email.full_body.length < 100) {
          const provider = email.email_connection_id 
            ? connectionMap.get(email.email_connection_id)
            : null;
          
          if (provider && email.message_id) {
            console.log(`[Email Reprocess] Re-fetching full body for email ${email.id} from ${provider}`);
            try {
              let fetchedMessage: any = null;
              if (provider === "gmail") {
                fetchedMessage = await fetchGmailMessage(userId, email.message_id);
                if (fetchedMessage) {
                  const metadata = extractGmailMetadata(fetchedMessage);
                  fullBodyText = htmlToText(metadata.fullBody || metadata.snippet);
                }
              } else if (provider === "outlook") {
                fetchedMessage = await fetchOutlookMessage(userId, email.message_id);
                if (fetchedMessage) {
                  const metadata = extractOutlookMetadata(fetchedMessage);
                  fullBodyText = htmlToText(metadata.fullBody || metadata.snippet);
                }
              }
              
              // Update full_body in database for future use
              if (fetchedMessage && fullBodyText.length > email.snippet?.length || 0) {
                await supabase
                  .from("email_metadata")
                  .update({ full_body: fullBodyText.substring(0, 10000) })
                  .eq("id", email.id);
              }
            } catch (fetchError) {
              console.error(`[Email Reprocess] Error re-fetching email ${email.id}:`, fetchError);
              // Continue with snippet if re-fetch fails
            }
          }
        }

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

