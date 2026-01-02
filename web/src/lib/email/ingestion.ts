import { createAdminClient } from "@/lib/supabase/admin";
import { hashEmailAddress, extractEmailAddress } from "./utils";
import { extractSignalsWithAI } from "./ai-signals";
import { htmlToText } from "./html-to-text";
import { fetchGmailMessages, extractGmailMetadata } from "./gmail";
import { fetchOutlookMessages, extractOutlookMetadata } from "./outlook";
import type { EmailProvider } from "./providers";

/**
 * Create an action from an AI-recommended email signal
 */
async function createActionFromEmailSignal(
  userId: string,
  personId: string,
  actionType: string,
  description: string,
  dueDate: string,
  emailMetadataId: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    
    const { data: action, error } = await supabase
      .from("actions")
      .insert({
        user_id: userId,
        person_id: personId,
        action_type: actionType,
        description: description,
        due_date: dueDate,
        state: "NEW",
        auto_created: true,
        notes: `Auto-created from email signal (email_metadata_id: ${emailMetadataId})`,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`[Email Ingestion] Error creating action from signal:`, error);
      return null;
    }

    console.log(`[Email Ingestion] ✅ Created action ${action.id} from email signal`);
    return action.id;
  } catch (error) {
    console.error(`[Email Ingestion] Error creating action from signal:`, error);
    return null;
  }
}

/**
 * Match email sender to a relationship (lead) by hashed email
 */
async function matchEmailToRelationship(
  userId: string,
  fromEmailHash: string
): Promise<string | null> {
  // Get all leads for this user
  const supabase = createAdminClient();
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, url, email, name")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  if (leadsError) {
    console.error(`[Email Match] Error fetching leads:`, leadsError);
    return null;
  }

  if (!leads || leads.length === 0) {
    console.log(`[Email Match] No active leads found for user ${userId}`);
    return null;
  }

  console.log(`[Email Match] Checking ${leads.length} active leads against email hash: ${fromEmailHash}`);

  // Check if any lead's email matches the hash
  for (const lead of leads) {
    // First check the new email field
    if (lead.email) {
      const emailHash = hashEmailAddress(lead.email);
      console.log(`[Email Match] Comparing lead "${lead.name}" email "${lead.email}" hash: ${emailHash}`);
      if (emailHash === fromEmailHash) {
        console.log(`[Email Match] ✅ MATCH FOUND: Lead "${lead.name}" (${lead.id}) matches email hash`);
        return lead.id;
      }
    }
    
    // Fallback: check legacy url field (mailto: format)
    if (lead.url?.startsWith("mailto:")) {
      const email = lead.url.substring(7); // Remove "mailto:" prefix
      const emailHash = hashEmailAddress(email);
      console.log(`[Email Match] Comparing lead "${lead.name}" legacy url email "${email}" hash: ${emailHash}`);
      if (emailHash === fromEmailHash) {
        console.log(`[Email Match] ✅ MATCH FOUND: Lead "${lead.name}" (${lead.id}) matches email hash (legacy url)`);
        return lead.id;
      }
    }
  }

  console.log(`[Email Match] ❌ No match found for email hash: ${fromEmailHash}`);
  return null;
}

/**
 * Ingest email metadata from Gmail
 * Strategy: Search for emails from each relationship's email address
 * This ensures we find emails even if they're not in the top 50 general messages
 */
export async function ingestGmailMetadata(userId: string): Promise<number> {
  try {
    console.log(`[Email Ingestion] Starting Gmail metadata ingestion for user ${userId}`);
    const supabase = createAdminClient();
    
    // Get user AI settings for AI-powered extraction
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", userId)
      .single();
    
    const userAiProvider = userProfile?.ai_provider || null;
    const userApiKeyEncrypted = userProfile?.ai_api_key_encrypted || null;
    const userModel = userProfile?.ai_model || null;
    
    // Get all active relationships with email addresses
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, url")
      .eq("user_id", userId)
      .eq("status", "ACTIVE");

    if (leadsError) {
      console.error(`[Email Ingestion] Error fetching leads:`, leadsError);
      return 0;
    }

    // Collect all email addresses from relationships
    const relationshipEmails: Array<{ leadId: string; leadName: string; email: string }> = [];
    for (const lead of leads || []) {
      if (lead.email) {
        relationshipEmails.push({
          leadId: lead.id,
          leadName: lead.name,
          email: lead.email,
        });
      }
      // Also check legacy url field
      if (lead.url?.startsWith("mailto:")) {
        const email = lead.url.substring(7);
        relationshipEmails.push({
          leadId: lead.id,
          leadName: lead.name,
          email,
        });
      }
    }

    console.log(`[Email Ingestion] Found ${relationshipEmails.length} relationship email addresses to search for`);

    if (relationshipEmails.length === 0) {
      console.log(`[Email Ingestion] No relationship emails found, skipping Gmail ingestion`);
      return 0;
    }

    // Search Gmail for emails from each relationship's email address
    const { searchGmailBySender } = await import("./gmail");
    let ingestedCount = 0;
    let skippedAlreadyExists = 0;

    for (const relEmail of relationshipEmails) {
      try {
        console.log(`[Email Ingestion] Searching Gmail for emails from: ${relEmail.email} (${relEmail.leadName})`);
        const messages = await searchGmailBySender(userId, relEmail.email, 50);
        console.log(`[Email Ingestion] Found ${messages.length} emails from ${relEmail.email}`);

        for (const message of messages) {
          const metadata = extractGmailMetadata(message);
          const fromEmail = extractEmailAddress(metadata.from);
          const fromEmailHash = hashEmailAddress(fromEmail);
          
          // We already know this matches because we searched by sender
          const personId = relEmail.leadId;

          // Extract signals using AI (with fallback to rule-based)
          const fullBodyText = htmlToText(metadata.fullBody || metadata.snippet);
          const signals = await extractSignalsWithAI(
            metadata.subject,
            metadata.snippet,
            fullBodyText,
            undefined,
            userAiProvider,
            userApiKeyEncrypted,
            userModel
          );

          // Calculate recommended due date
          let recommendedDueDate: string | null = null;
          if (signals.recommendedAction?.due_date_days !== null && signals.recommendedAction?.due_date_days !== undefined) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + signals.recommendedAction.due_date_days);
            recommendedDueDate = dueDate.toISOString().split("T")[0]; // YYYY-MM-DD format
          } else if (signals.recommendedAction?.action_type) {
            // Default to tomorrow if action is recommended but no specific due_date_days
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            recommendedDueDate = tomorrow.toISOString().split("T")[0];
          }

          // Check if metadata already exists
          const { data: existing } = await supabase
            .from("email_metadata")
            .select("id")
            .eq("user_id", userId)
            .eq("message_id", metadata.messageId)
            .maybeSingle();

          if (existing) {
            skippedAlreadyExists++;
            continue; // Skip already ingested messages
          }

          // Get email connection ID
          const { data: connection } = await supabase
            .from("email_connections")
            .select("id")
            .eq("user_id", userId)
            .eq("provider", "gmail")
            .eq("status", "active")
            .single();

          if (!connection) {
            console.error("No active Gmail connection found for user", userId);
            continue;
          }

          // Insert email metadata (only for matched relationships)
          const { error, data: insertedEmail } = await supabase
            .from("email_metadata")
            .insert({
              user_id: userId,
              email_connection_id: connection.id,
              message_id: metadata.messageId,
              thread_id: metadata.threadId,
              from_email_hash: fromEmailHash,
              to_email_hash: hashEmailAddress(extractEmailAddress(metadata.to)),
              subject: metadata.subject,
              snippet: metadata.snippet.substring(0, 200), // Limit to 200 chars
              full_body: fullBodyText.substring(0, 10000), // Limit to 10KB for storage
              received_at: metadata.receivedAt,
              person_id: personId,
              last_topic: signals.topic,
              ask: signals.asks.length > 0 ? signals.asks[0] : null,
              open_loops: signals.openLoops.length > 0 ? signals.openLoops : null,
              priority: signals.priority,
              sentiment: signals.sentiment,
              intent: signals.intent,
              recommended_action_type: signals.recommendedAction?.action_type || null,
              recommended_action_description: signals.recommendedAction?.description || null,
              recommended_due_date: recommendedDueDate,
              // Comprehensive signal fields
              thread_summary_1l: signals.thread_summary_1l,
              thread_summary_detail: signals.thread_summary_detail,
              primary_category: signals.primary_category,
              secondary_categories: signals.secondary_categories,
              topics_comprehensive: signals.topics,
              proposed_tiers: signals.proposed_tiers || null, // JSONB - store as object, not string
              asks_from_sender: signals.asks_from_sender,
              value_to_capture: signals.value_to_capture,
              suggested_next_actions: signals.suggested_next_actions,
              attachments: signals.attachments || null, // JSONB - store as object, not string
              links: signals.links || null, // JSONB - store as object, not string
              relationship_signal: signals.relationship_signal || null, // JSONB - store as object, not string
              processed_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (!error && insertedEmail) {
            ingestedCount++;
            
            // If AI recommended an action, create it
            if (signals.recommendedAction?.action_type && recommendedDueDate) {
              await createActionFromEmailSignal(
                userId,
                personId,
                signals.recommendedAction.action_type,
                signals.recommendedAction.description || `Follow up on: ${signals.topic}`,
                recommendedDueDate,
                insertedEmail.id
              );
            }
          } else {
            console.error("Error ingesting Gmail metadata:", error);
          }
        }
      } catch (error) {
        console.error(`[Email Ingestion] Error searching for emails from ${relEmail.email}:`, error);
        // Continue with other relationships even if one fails
      }
    }

    // Update last_sync_at
    await supabase
      .from("email_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "gmail");

    console.log(`[Email Ingestion] Gmail complete - Ingested: ${ingestedCount}, Skipped (exists): ${skippedAlreadyExists}`);
    return ingestedCount;
  } catch (error) {
    console.error("Error ingesting Gmail metadata:", error);
    throw error;
  }
}

/**
 * Ingest email metadata from Outlook
 */
export async function ingestOutlookMetadata(userId: string): Promise<number> {
  try {
    console.log(`[Email Ingestion] Starting Outlook metadata ingestion for user ${userId}`);
    const messages = await fetchOutlookMessages(userId, 50);
    console.log(`[Email Ingestion] Fetched ${messages.length} Outlook messages`);
    const supabase = createAdminClient();
    
    // Get user AI settings for AI-powered extraction
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", userId)
      .single();
    
    const userAiProvider = userProfile?.ai_provider || null;
    const userApiKeyEncrypted = userProfile?.ai_api_key_encrypted || null;
    const userModel = userProfile?.ai_model || null;
    
    let ingestedCount = 0;
    let skippedNoMatch = 0;
    let skippedAlreadyExists = 0;

    for (const message of messages) {
      const metadata = extractOutlookMetadata(message);
      const fromEmail = extractEmailAddress(metadata.from);
      const fromEmailHash = hashEmailAddress(fromEmail);
      
      console.log(`[Email Ingestion] Processing Outlook message from: ${fromEmail} (hash: ${fromEmailHash})`);
      
      // Match to relationship if possible
      const personId = await matchEmailToRelationship(userId, fromEmailHash);

      // Only process emails from relationships the user is tracking
      // Skip emails that don't match any relationship
      if (!personId) {
        skippedNoMatch++;
        continue; // Skip emails from unknown senders (not in relationships)
      }

      // Extract signals using AI (with fallback to rule-based)
      const fullBodyText = htmlToText(metadata.fullBody || metadata.snippet);
      const signals = await extractSignalsWithAI(
        metadata.subject,
        metadata.snippet,
        fullBodyText,
        metadata.importance,
        userAiProvider,
        userApiKeyEncrypted,
        userModel
      );

      // Calculate recommended due date
      let recommendedDueDate: string | null = null;
      if (signals.recommendedAction?.due_date_days !== null && signals.recommendedAction?.due_date_days !== undefined) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + signals.recommendedAction.due_date_days);
        recommendedDueDate = dueDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      } else if (signals.recommendedAction?.action_type) {
        // Default to tomorrow if action is recommended but no specific due_date_days
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        recommendedDueDate = tomorrow.toISOString().split("T")[0];
      }

      // Check if metadata already exists
      const { data: existing } = await supabase
        .from("email_metadata")
        .select("id")
        .eq("user_id", userId)
        .eq("message_id", metadata.messageId)
        .maybeSingle();

      if (existing) {
        skippedAlreadyExists++;
        continue; // Skip already ingested messages
      }

      // Get email connection ID
      const { data: connection } = await supabase
        .from("email_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("provider", "outlook")
        .eq("status", "active")
        .single();

      if (!connection) {
        console.error("No active Outlook connection found for user", userId);
        continue;
      }

      // Insert email metadata (only for matched relationships)
      const { error, data: insertedEmail } = await supabase
        .from("email_metadata")
        .insert({
          user_id: userId,
          email_connection_id: connection.id,
          message_id: metadata.messageId,
          thread_id: metadata.threadId,
          from_email_hash: fromEmailHash,
          to_email_hash: hashEmailAddress(extractEmailAddress(metadata.to)),
          subject: metadata.subject,
          snippet: metadata.snippet.substring(0, 200), // Limit to 200 chars
          full_body: fullBodyText.substring(0, 10000), // Limit to 10KB for storage
          received_at: metadata.receivedAt,
          person_id: personId,
          last_topic: signals.topic,
          ask: signals.asks.length > 0 ? signals.asks[0] : null,
          open_loops: signals.openLoops.length > 0 ? signals.openLoops : null,
          labels: metadata.categories || null,
          priority: signals.priority,
          sentiment: signals.sentiment,
          intent: signals.intent,
          recommended_action_type: signals.recommendedAction?.action_type || null,
          recommended_action_description: signals.recommendedAction?.description || null,
          recommended_due_date: recommendedDueDate,
          // Comprehensive signal fields
          thread_summary_1l: signals.thread_summary_1l,
          thread_summary_detail: signals.thread_summary_detail,
          primary_category: signals.primary_category,
          secondary_categories: signals.secondary_categories,
          topics_comprehensive: signals.topics,
          proposed_tiers: signals.proposed_tiers ? JSON.stringify(signals.proposed_tiers) : null,
          asks_from_sender: signals.asks_from_sender,
          value_to_capture: signals.value_to_capture,
          suggested_next_actions: signals.suggested_next_actions,
          attachments: signals.attachments ? JSON.stringify(signals.attachments) : null,
          links: signals.links ? JSON.stringify(signals.links) : null,
          relationship_signal: signals.relationship_signal ? JSON.stringify(signals.relationship_signal) : null,
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && insertedEmail) {
        ingestedCount++;
        
        // If AI recommended an action, create it
        if (signals.recommendedAction?.action_type && recommendedDueDate) {
          await createActionFromEmailSignal(
            userId,
            personId,
            signals.recommendedAction.action_type,
            signals.recommendedAction.description || `Follow up on: ${signals.topic}`,
            recommendedDueDate,
            insertedEmail.id
          );
        }
      } else {
        console.error("Error ingesting Outlook metadata:", error);
      }
    }

    // Update last_sync_at
    await supabase
      .from("email_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "outlook");

    console.log(`[Email Ingestion] Outlook complete - Ingested: ${ingestedCount}, Skipped (no match): ${skippedNoMatch}, Skipped (exists): ${skippedAlreadyExists}`);
    return ingestedCount;
  } catch (error) {
    console.error("Error ingesting Outlook metadata:", error);
    throw error;
  }
}

/**
 * Ingest email metadata for a user (checks which providers are connected)
 */
export async function ingestEmailMetadata(userId: string): Promise<{
  gmail: number;
  outlook: number;
}> {
  console.log(`[Email Ingestion] Starting email metadata ingestion for user ${userId}`);
  const supabase = createAdminClient();
  const { data: connections, error: connError } = await supabase
    .from("email_connections")
    .select("provider, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (connError) {
    console.error(`[Email Ingestion] Error fetching connections:`, connError);
  }

  console.log(`[Email Ingestion] Found ${connections?.length || 0} active email connections:`, connections?.map(c => `${c.provider} (${c.status})`));

  const results = { gmail: 0, outlook: 0 };

  if (!connections || connections.length === 0) {
    console.log(`[Email Ingestion] No active email connections found for user ${userId}`);
    return results;
  }

  // Ingest from each connected provider
  for (const conn of connections) {
    try {
      console.log(`[Email Ingestion] Processing ${conn.provider} connection`);
      if (conn.provider === "gmail") {
        results.gmail = await ingestGmailMetadata(userId);
      } else if (conn.provider === "outlook") {
        results.outlook = await ingestOutlookMetadata(userId);
      }
    } catch (error) {
      console.error(`[Email Ingestion] Error ingesting ${conn.provider} metadata:`, error);
      // Continue with other providers even if one fails
    }
  }

  console.log(`[Email Ingestion] Complete - Gmail: ${results.gmail}, Outlook: ${results.outlook}`);
  return results;
}

/**
 * Backfill email metadata: Match existing emails to relationships
 * This is useful when:
 * - A relationship is created after emails were already ingested
 * - Email addresses are added to existing relationships
 * 
 * Updates email_metadata records where person_id is null by matching
 * from_email_hash to relationship email hashes.
 */
export async function backfillEmailMetadata(userId: string): Promise<number> {
  const supabase = createAdminClient();
  let matchedCount = 0;

  try {
    // Get all unmatched email metadata for this user
    const { data: unmatchedEmails } = await supabase
      .from("email_metadata")
      .select("id, from_email_hash")
      .eq("user_id", userId)
      .is("person_id", null);

    if (!unmatchedEmails || unmatchedEmails.length === 0) {
      return 0;
    }

    // Get all leads for this user with email addresses
    const { data: leads } = await supabase
      .from("leads")
      .select("id, email, url, name")
      .eq("user_id", userId)
      .eq("status", "ACTIVE");

    if (!leads || leads.length === 0) {
      return 0;
    }

    // Build a map of email hash -> lead id
    const emailHashToLeadId = new Map<string, string>();
    const emailToLeadId = new Map<string, { leadId: string; leadName: string }>(); // For debugging
    
    for (const lead of leads) {
      // Check new email field
      if (lead.email) {
        const emailHash = hashEmailAddress(lead.email);
        emailHashToLeadId.set(emailHash, lead.id);
        emailToLeadId.set(lead.email.toLowerCase().trim(), { leadId: lead.id, leadName: lead.name });
      }
      
      // Check legacy url field (mailto: format)
      if (lead.url?.startsWith("mailto:")) {
        const email = lead.url.substring(7); // Remove "mailto:" prefix
        const emailHash = hashEmailAddress(email);
        emailHashToLeadId.set(emailHash, lead.id);
        emailToLeadId.set(email.toLowerCase().trim(), { leadId: lead.id, leadName: lead.name });
      }
    }

    // Match and update email metadata
    for (const email of unmatchedEmails) {
      const leadId = emailHashToLeadId.get(email.from_email_hash);
      
      if (leadId) {
        const { error } = await supabase
          .from("email_metadata")
          .update({ person_id: leadId })
          .eq("id", email.id);

        if (!error) {
          matchedCount++;
        } else {
          console.error(`Error updating email metadata ${email.id}:`, error);
        }
      } else {
        // Log unmatched emails for debugging
        console.log(`[Email Backfill] No match found for email hash: ${email.from_email_hash}`);
        console.log(`[Email Backfill] Available relationship emails:`, Array.from(emailToLeadId.keys()));
        
        // Also log the email metadata ID for debugging
        const { data: emailMeta } = await supabase
          .from("email_metadata")
          .select("id, subject, received_at")
          .eq("id", email.id)
          .single();
        if (emailMeta) {
          console.log(`[Email Backfill] Unmatched email: ${emailMeta.subject} (received: ${emailMeta.received_at})`);
        }
      }
    }

    return matchedCount;
  } catch (error) {
    console.error("Error backfilling email metadata:", error);
    throw error;
  }
}

