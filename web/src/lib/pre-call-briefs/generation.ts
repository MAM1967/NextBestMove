import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeadBasic,
  ActionHistory,
  PreCallBrief,
  DetectedCall,
} from "./types";

/**
 * Get action history for a lead
 */
export async function getActionHistory(
  supabase: SupabaseClient,
  userId: string,
  leadId: string
): Promise<ActionHistory> {
  // Get all actions for this lead
  const { data: actions } = await supabase
    .from("actions")
    .select("id, state, completed_at, notes, created_at")
    .eq("user_id", userId)
    .eq("person_id", leadId)
    .order("created_at", { ascending: false });

  if (!actions || actions.length === 0) {
    return {
      lastActionDate: null,
      lastActionNotes: null,
      totalActions: 0,
      repliesReceived: 0,
      lastReplyDate: null,
    };
  }

  // Find most recent action with notes
  const lastActionWithNotes = actions.find((a) => a.notes);
  const lastActionDate = actions[0]?.created_at
    ? new Date(actions[0].created_at)
    : null;
  const lastActionNotes = lastActionWithNotes?.notes || null;

  // Count replies
  const replies = actions.filter((a) => a.state === "REPLIED");
  const lastReply = replies[0];
  const lastReplyDate = lastReply?.completed_at
    ? new Date(lastReply.completed_at)
    : null;

  return {
    lastActionDate,
    lastActionNotes,
    totalActions: actions.length,
    repliesReceived: replies.length,
    lastReplyDate,
  };
}

/**
 * Generate next step suggestions based on action history
 */
function generateNextStepSuggestions(history: ActionHistory): string[] {
  const suggestions: string[] = [];

  if (history.repliesReceived === 0 && history.totalActions > 0) {
    suggestions.push("Follow up on your last outreach");
  }

  if (history.lastReplyDate) {
    const daysSinceReply = Math.floor(
      (Date.now() - history.lastReplyDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReply > 7) {
      suggestions.push("Re-engage after a week of silence");
    } else if (daysSinceReply > 3) {
      suggestions.push("Continue the conversation thread");
    }
  }

  if (history.totalActions === 0) {
    suggestions.push("This is a new contact - introduce yourself");
  } else if (history.totalActions === 1) {
    suggestions.push("Build on your initial outreach");
  }

  if (history.lastActionNotes) {
    suggestions.push("Reference your previous notes about this contact");
  }

  return suggestions.length > 0 ? suggestions : ["Prepare talking points"];
}

/**
 * Generate brief content from action history and lead
 */
function generateBriefContent(
  lead: LeadBasic | null,
  history: ActionHistory,
  suggestions: string[]
): string {
  const sections: string[] = [];

  // Header
  if (lead) {
    sections.push(`## ${lead.name}`);
    if (lead.notes) {
      sections.push(`**Notes:** ${lead.notes}`);
    }
  }

  // Last Interaction
  sections.push("### Last Interaction");
  if (history.lastActionDate) {
    const daysAgo = Math.floor(
      (Date.now() - history.lastActionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    sections.push(
      `Last contact: ${daysAgo === 0 ? "Today" : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`}`
    );
    if (history.lastActionNotes) {
      sections.push(`**Context:** ${history.lastActionNotes}`);
    }
  } else {
    sections.push("No previous interactions");
  }

  // Follow-Up History
  sections.push("### Follow-Up History");
  sections.push(
    `Total actions: ${history.totalActions} | Replies received: ${history.repliesReceived}`
  );
  if (history.lastReplyDate) {
    const daysSinceReply = Math.floor(
      (Date.now() - history.lastReplyDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    sections.push(
      `Last reply: ${daysSinceReply === 0 ? "Today" : `${daysSinceReply} day${daysSinceReply !== 1 ? "s" : ""} ago`}`
    );
  }

  // Next Steps
  if (suggestions.length > 0) {
    sections.push("### Suggested Talking Points");
    suggestions.forEach((suggestion) => {
      sections.push(`- ${suggestion}`);
    });
  }

  return sections.join("\n\n");
}

/**
 * Generate a pre-call brief for a detected call
 */
export async function generatePreCallBrief(
  supabase: SupabaseClient,
  userId: string,
  detectedCall: DetectedCall
): Promise<PreCallBrief> {
  const { event, matchedLead } = detectedCall;

  let history: ActionHistory = {
    lastActionDate: null,
    lastActionNotes: null,
    totalActions: 0,
    repliesReceived: 0,
    lastReplyDate: null,
  };

  if (matchedLead) {
    history = await getActionHistory(supabase, userId, matchedLead.id);
  }

  const suggestions = generateNextStepSuggestions(history);
  const briefContent = generateBriefContent(
    matchedLead,
    history,
    suggestions
  );

  // Aggregate user notes from actions
  let userNotes: string | null = null;
  if (matchedLead) {
    const { data: actionsWithNotes } = await supabase
      .from("actions")
      .select("notes")
      .eq("user_id", userId)
      .eq("person_id", matchedLead.id)
      .not("notes", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (actionsWithNotes && actionsWithNotes.length > 0) {
      const notes = actionsWithNotes
        .map((a) => a.notes)
        .filter((n): n is string => n !== null)
        .join(" | ");
      userNotes = notes;
    }
  }

  return {
    calendarEventId: event.id,
    eventTitle: event.title,
    eventStart: new Date(event.start),
    leadId: matchedLead?.id || null,
    personPinId: matchedLead?.id || null, // @deprecated Legacy field for backward compatibility - use leadId
    personName: matchedLead?.name || null,
    briefContent,
    lastInteractionDate: history.lastActionDate,
    followUpCount: history.totalActions,
    nextStepSuggestions: suggestions,
    userNotes,
    hasVideoConference: event.hasVideoConference || false,
  };
}

