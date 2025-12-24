import type { SupabaseClient } from "@supabase/supabase-js";
import { hashEmailAddress, extractEmailAddress } from "./utils";

/**
 * Email signals for decision engine integration
 */
export interface EmailSignalsForDecision {
  hasOpenLoops: boolean;
  hasUnansweredAsks: boolean;
  daysSinceLastEmail: number | null;
  recentEmailCount: number;
}

/**
 * Fetch email signals for a relationship to use in decision engine.
 * This is called during decision engine scoring to inform stall risk.
 */
export async function getEmailSignalsForRelationship(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
  leadUrl: string | null
): Promise<EmailSignalsForDecision> {

  // Extract email from lead URL if it's a mailto: link
  let emailHash: string | null = null;
  if (leadUrl?.startsWith("mailto:")) {
    const email = extractEmailAddress(leadUrl.substring(7));
    emailHash = hashEmailAddress(email);
  }

  if (!emailHash) {
    // No email to match
    return {
      hasOpenLoops: false,
      hasUnansweredAsks: false,
      daysSinceLastEmail: null,
      recentEmailCount: 0,
    };
  }

  // Fetch recent email metadata for this relationship (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentEmails } = await supabase
    .from("email_metadata")
    .select("id, received_at, open_loops, ask, from_email_hash")
    .eq("user_id", userId)
    .eq("from_email_hash", emailHash)
    .gte("received_at", thirtyDaysAgo.toISOString())
    .order("received_at", { ascending: false })
    .limit(50);

  if (!recentEmails || recentEmails.length === 0) {
    return {
      hasOpenLoops: false,
      hasUnansweredAsks: false,
      daysSinceLastEmail: null,
      recentEmailCount: 0,
    };
  }

  // Check for open loops
  const hasOpenLoops = recentEmails.some(
    (email) => email.open_loops && email.open_loops.length > 0
  );

  // Check for unanswered asks (asks from last 14 days that haven't been resolved)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentAsks = recentEmails.filter(
    (email) =>
      email.ask &&
      email.received_at &&
      new Date(email.received_at) >= fourteenDaysAgo
  );
  const hasUnansweredAsks = recentAsks.length > 0;

  // Calculate days since last email
  const lastEmail = recentEmails[0];
  const daysSinceLastEmail = lastEmail?.received_at
    ? Math.floor(
        (Date.now() - new Date(lastEmail.received_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return {
    hasOpenLoops,
    hasUnansweredAsks,
    daysSinceLastEmail,
    recentEmailCount: recentEmails.length,
  };
}

