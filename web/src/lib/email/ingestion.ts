import { createAdminClient } from "@/lib/supabase/admin";
import { hashEmailAddress, extractEmailAddress } from "./utils";
import { extractSignals } from "./signals";
import { fetchGmailMessages, extractGmailMetadata } from "./gmail";
import { fetchOutlookMessages, extractOutlookMetadata } from "./outlook";
import type { EmailProvider } from "./providers";

/**
 * Match email sender to a relationship (lead) by hashed email
 */
async function matchEmailToRelationship(
  userId: string,
  fromEmailHash: string
): Promise<string | null> {
  // Get all leads for this user
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, url, name")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  if (!leads || leads.length === 0) {
    return null;
  }

  // Check if any lead's URL contains an email that matches the hash
  for (const lead of leads) {
    if (lead.url.startsWith("mailto:")) {
      const email = lead.url.substring(7); // Remove "mailto:" prefix
      const emailHash = hashEmailAddress(email);
      if (emailHash === fromEmailHash) {
        return lead.id;
      }
    }
  }

  return null;
}

/**
 * Ingest email metadata from Gmail
 */
export async function ingestGmailMetadata(userId: string): Promise<number> {
  try {
    const messages = await fetchGmailMessages(userId, 50);
    const supabase = createAdminClient();
    let ingestedCount = 0;

    for (const message of messages) {
      const metadata = extractGmailMetadata(message);
      const fromEmail = extractEmailAddress(metadata.from);
      const fromEmailHash = hashEmailAddress(fromEmail);
      
      // Match to relationship if possible
      const personId = await matchEmailToRelationship(userId, fromEmailHash);

      // Extract signals
      const signals = extractSignals(
        metadata.subject,
        metadata.snippet,
        undefined
      );

      // Check if metadata already exists
      const { data: existing } = await supabase
        .from("email_metadata")
        .select("id")
        .eq("user_id", userId)
        .eq("message_id", metadata.messageId)
        .maybeSingle();

      if (existing) {
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

      // Insert email metadata
      const { error } = await supabase.from("email_metadata").insert({
        user_id: userId,
        email_connection_id: connection.id,
        message_id: metadata.messageId,
        thread_id: metadata.threadId,
        from_email_hash: fromEmailHash,
        to_email_hash: hashEmailAddress(extractEmailAddress(metadata.to)),
        subject: metadata.subject,
        snippet: metadata.snippet.substring(0, 200), // Limit to 200 chars
        received_at: metadata.receivedAt,
        person_id: personId,
        last_topic: signals.topic,
        ask: signals.asks.length > 0 ? signals.asks[0] : null,
        open_loops: signals.openLoops.length > 0 ? signals.openLoops : null,
        priority: signals.priority,
        processed_at: new Date().toISOString(),
      });

      if (!error) {
        ingestedCount++;
      } else {
        console.error("Error ingesting Gmail metadata:", error);
      }
    }

    // Update last_sync_at
    await supabase
      .from("email_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "gmail");

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
    const messages = await fetchOutlookMessages(userId, 50);
    const supabase = createAdminClient();
    let ingestedCount = 0;

    for (const message of messages) {
      const metadata = extractOutlookMetadata(message);
      const fromEmail = extractEmailAddress(metadata.from);
      const fromEmailHash = hashEmailAddress(fromEmail);
      
      // Match to relationship if possible
      const personId = await matchEmailToRelationship(userId, fromEmailHash);

      // Extract signals
      const signals = extractSignals(
        metadata.subject,
        metadata.snippet,
        metadata.importance
      );

      // Check if metadata already exists
      const { data: existing } = await supabase
        .from("email_metadata")
        .select("id")
        .eq("user_id", userId)
        .eq("message_id", metadata.messageId)
        .maybeSingle();

      if (existing) {
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

      // Insert email metadata
      const { error } = await supabase.from("email_metadata").insert({
        user_id: userId,
        email_connection_id: connection.id,
        message_id: metadata.messageId,
        thread_id: metadata.threadId,
        from_email_hash: fromEmailHash,
        to_email_hash: hashEmailAddress(extractEmailAddress(metadata.to)),
        subject: metadata.subject,
        snippet: metadata.snippet.substring(0, 200), // Limit to 200 chars
        received_at: metadata.receivedAt,
        person_id: personId,
        last_topic: signals.topic,
        ask: signals.asks.length > 0 ? signals.asks[0] : null,
        open_loops: signals.openLoops.length > 0 ? signals.openLoops : null,
        labels: metadata.categories || null,
        priority: signals.priority,
        processed_at: new Date().toISOString(),
      });

      if (!error) {
        ingestedCount++;
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
  const supabase = createAdminClient();
  const { data: connections } = await supabase
    .from("email_connections")
    .select("provider")
    .eq("user_id", userId)
    .eq("status", "active");

  const results = { gmail: 0, outlook: 0 };

  if (!connections || connections.length === 0) {
    return results;
  }

  // Ingest from each connected provider
  for (const conn of connections) {
    try {
      if (conn.provider === "gmail") {
        results.gmail = await ingestGmailMetadata(userId);
      } else if (conn.provider === "outlook") {
        results.outlook = await ingestOutlookMetadata(userId);
      }
    } catch (error) {
      console.error(`Error ingesting ${conn.provider} metadata:`, error);
      // Continue with other providers even if one fails
    }
  }

  return results;
}





