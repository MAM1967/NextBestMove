import { generateWithAI } from "./openai";

type Metrics = {
  daysActive: number;
  actionsCompleted: number;
  replies: number;
  callsBooked: number;
  insightText?: string;
  userAiProvider?: string | null;
  userApiKeyEncrypted?: string | null;
  userModel?: string | null;
};

/**
 * Generate WIN_POST content prompt
 * Template-based with AI enhancement for phrasing
 */
export async function generateWinPost(metrics: Metrics): Promise<string> {
  const winParts: string[] = [];
  
  if (metrics.callsBooked > 0) {
    winParts.push(
      `booked ${metrics.callsBooked} call${metrics.callsBooked !== 1 ? "s" : ""}`
    );
  }
  if (metrics.replies > 0) {
    winParts.push(
      `received ${metrics.replies} repl${metrics.replies !== 1 ? "ies" : "y"}`
    );
  }
  if (metrics.actionsCompleted >= 10) {
    winParts.push(`completed ${metrics.actionsCompleted} actions`);
  }

  if (winParts.length === 0) {
    return ""; // No win to post about
  }

  const winDescription = winParts.join(" and ");
  
  // Template for win post
  const template = `A small win from last week: ${winDescription}. Here's what changed when I focused on consistent follow-ups...`;
  
  // AI-enhanced version with context
  const aiPrompt = `Create a LinkedIn-style post about a weekly win. The user ${winDescription} this week. 
Write 3-6 sentences that:
- Start with acknowledging the win
- Briefly explain what changed or what they focused on
- Keep it authentic and conversational
- End with a subtle insight or reflection

Use this as inspiration: "${template}"`;

  const fallback = template;
  
  return await generateWithAI(
    aiPrompt,
    { winDescription },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

/**
 * Generate INSIGHT_POST content prompt
 * Based on weekly insight or reply rate patterns
 */
export async function generateInsightPost(metrics: Metrics): Promise<string> {
  // Use provided insight text if available, otherwise calculate from metrics
  let insight = metrics.insightText;
  
  if (!insight && metrics.replies > 0 && metrics.actionsCompleted > 0) {
    const replyRate = Math.round((metrics.replies / metrics.actionsCompleted) * 100);
    if (replyRate >= 20) {
      insight = `Follow-ups within 3 days convert 2x better`;
    } else {
      insight = `Timing matters - follow-ups convert better when done consistently`;
    }
  }

  if (!insight) {
    return ""; // No insight to post about
  }

  // Template for insight post
  const template = `One insight from recent conversations: ${insight}. Here's how I'm approaching it...`;
  
  // AI-enhanced version
  const aiPrompt = `Create a LinkedIn-style post sharing a business insight. The insight is: "${insight}".
Write 3-6 sentences that:
- Start with the insight or observation
- Briefly explain the approach or what you learned
- Keep it practical and actionable
- End with a question or reflection

Use this as inspiration: "${template}"`;

  const fallback = template;
  
  return await generateWithAI(
    aiPrompt,
    { insight },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

