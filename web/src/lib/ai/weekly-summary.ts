import { generateWithAI } from "./openai";
import type { SupabaseClient } from "@supabase/supabase-js";

type WeeklySummaryMetrics = {
  daysActive: number;
  actionsCompleted: number;
  replies: number;
  callsBooked: number;
  currentStreak: number;
  userAiProvider?: string | null;
  userApiKeyEncrypted?: string | null;
  userModel?: string | null;
};

/**
 * Generate AI narrative summary for weekly summary (Standard tier)
 * Uses basic AI prompts
 */
export async function generateAINarrativeSummary(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  const parts: string[] = [];
  if (metrics.actionsCompleted > 0) {
    parts.push(
      `You completed ${metrics.actionsCompleted} action${
        metrics.actionsCompleted !== 1 ? "s" : ""
      } across ${metrics.daysActive} day${metrics.daysActive !== 1 ? "s" : ""} this week.`
    );
  }
  if (metrics.replies > 0) {
    parts.push(`You received ${metrics.replies} repl${metrics.replies !== 1 ? "ies" : "y"}.`);
  }
  if (metrics.callsBooked > 0) {
    parts.push(
      `You booked ${metrics.callsBooked} call${metrics.callsBooked !== 1 ? "s" : ""}.`
    );
  }

  const template = parts.join(" ");
  
  if (metrics.actionsCompleted === 0) {
    return "This week was quiet. Ready to build momentum next week?";
  }

  // Basic AI prompt for Standard tier
  const aiPrompt = `Create a brief 2-3 sentence summary of the user's week. 
They completed ${metrics.actionsCompleted} actions across ${metrics.daysActive} days${metrics.replies > 0 ? `, received ${metrics.replies} replies` : ""}${metrics.callsBooked > 0 ? `, and booked ${metrics.callsBooked} calls` : ""}.
Keep it encouraging and concise. Use this as a template: "${template}"`;

  const fallback = template;

  return await generateWithAI(
    aiPrompt,
    {
      actionsCompleted: metrics.actionsCompleted,
      daysActive: metrics.daysActive,
      replies: metrics.replies,
      callsBooked: metrics.callsBooked,
    },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

/**
 * Generate enhanced AI narrative summary for weekly summary (Premium tier)
 * Uses enhanced prompts with more context
 */
export async function generateEnhancedAINarrativeSummary(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  const parts: string[] = [];
  if (metrics.actionsCompleted > 0) {
    parts.push(
      `You completed ${metrics.actionsCompleted} action${
        metrics.actionsCompleted !== 1 ? "s" : ""
      } across ${metrics.daysActive} day${metrics.daysActive !== 1 ? "s" : ""} this week.`
    );
  }
  if (metrics.replies > 0) {
    parts.push(`You received ${metrics.replies} repl${metrics.replies !== 1 ? "ies" : "y"}.`);
  }
  if (metrics.callsBooked > 0) {
    parts.push(
      `You booked ${metrics.callsBooked} call${metrics.callsBooked !== 1 ? "s" : ""}.`
    );
  }

  const template = parts.join(" ");
  
  if (metrics.actionsCompleted === 0) {
    return "This week was quiet. Ready to build momentum next week?";
  }

  // Enhanced AI prompt for Premium tier with more context
  const replyRate = metrics.actionsCompleted > 0 
    ? Math.round((metrics.replies / metrics.actionsCompleted) * 100) 
    : 0;
  
  const aiPrompt = `Create a thoughtful 2-3 sentence summary of the user's week with deeper context.
Metrics:
- ${metrics.actionsCompleted} actions completed across ${metrics.daysActive} days
- ${metrics.replies} replies received${replyRate > 0 ? ` (${replyRate}% reply rate)` : ""}
- ${metrics.callsBooked} calls booked
- Current streak: ${metrics.currentStreak} days

Provide a narrative that:
- Acknowledges their progress and consistency
- Highlights what's working (replies, calls, or consistency)
- Offers subtle encouragement or insight
- Feels personal and authentic

Use this as a template: "${template}"`;

  const fallback = template;

  return await generateWithAI(
    aiPrompt,
    {
      actionsCompleted: metrics.actionsCompleted,
      daysActive: metrics.daysActive,
      replies: metrics.replies,
      callsBooked: metrics.callsBooked,
      replyRate,
      currentStreak: metrics.currentStreak,
    },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

/**
 * Generate AI insight for weekly summary (Standard tier)
 * Uses basic AI prompts
 */
export async function generateAIInsight(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  if (metrics.actionsCompleted === 0) {
    return "Start with small, consistent actions to build momentum.";
  }

  // Calculate basic patterns
  const replyRate = metrics.actionsCompleted > 0 
    ? Math.round((metrics.replies / metrics.actionsCompleted) * 100) 
    : 0;

  let template = "Small actions add up. Keep the rhythm going.";
  
  if (replyRate >= 30) {
    template = "Your follow-ups are getting strong engagement. Keep the momentum!";
  } else if (replyRate >= 15) {
    template = "Your follow-ups are working. Consider following up sooner for even better results.";
  } else if (metrics.daysActive >= 5 && metrics.actionsCompleted >= 10) {
    template = "You're building strong consistency. This rhythm will compound over time.";
  } else if (metrics.daysActive < 3 && metrics.actionsCompleted > 0) {
    template = "Focus on consistency—even 3-4 active days per week makes a big difference.";
  }

  // Basic AI prompt for Standard tier
  const aiPrompt = `Generate a brief, actionable insight based on the user's week:
- ${metrics.actionsCompleted} actions completed
- ${metrics.daysActive} active days
- ${metrics.replies} replies received${replyRate > 0 ? ` (${replyRate}% reply rate)` : ""}
- ${metrics.callsBooked} calls booked

Provide one clear, actionable insight that helps them improve. Keep it to one sentence. Use this as inspiration: "${template}"`;

  const fallback = template;

  return await generateWithAI(
    aiPrompt,
    {
      actionsCompleted: metrics.actionsCompleted,
      daysActive: metrics.daysActive,
      replies: metrics.replies,
      replyRate,
      callsBooked: metrics.callsBooked,
    },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

/**
 * Generate enhanced AI insights for weekly summary (Premium tier)
 * Can generate multiple insights
 */
export async function generateEnhancedAIInsights(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string[]> {
  if (metrics.actionsCompleted === 0) {
    return ["Start with small, consistent actions to build momentum."];
  }

  // Calculate patterns
  const replyRate = metrics.actionsCompleted > 0 
    ? Math.round((metrics.replies / metrics.actionsCompleted) * 100) 
    : 0;
  const actionsPerDay = metrics.daysActive > 0 
    ? Math.round((metrics.actionsCompleted / metrics.daysActive) * 10) / 10 
    : 0;

  const insights: string[] = [];

  // Generate multiple insights for Premium tier
  const aiPrompt = `Generate 2-3 actionable insights based on the user's week:
- ${metrics.actionsCompleted} actions completed across ${metrics.daysActive} days (${actionsPerDay} per day)
- ${metrics.replies} replies received${replyRate > 0 ? ` (${replyRate}% reply rate)` : ""}
- ${metrics.callsBooked} calls booked
- Current streak: ${metrics.currentStreak} days

Provide 2-3 distinct insights that:
- Are specific and actionable
- Highlight patterns or opportunities
- Help them improve their approach
- Each insight should be one sentence

Format as a numbered list, one insight per line.`;

  const fallback = [
    replyRate >= 30 
      ? "Your follow-ups are getting strong engagement. Keep the momentum!"
      : replyRate >= 15
      ? "Your follow-ups are working. Consider following up sooner for even better results."
      : "Small actions add up. Keep the rhythm going.",
    metrics.daysActive >= 5 && metrics.actionsCompleted >= 10
      ? "You're building strong consistency. This rhythm will compound over time."
      : metrics.daysActive < 3
      ? "Focus on consistency—even 3-4 active days per week makes a big difference."
      : "Maintain your current pace and watch for patterns.",
  ];

  try {
    const client = await import("./openai").then(m => m.getOpenAIClientForUser(
      metrics.userAiProvider,
      metrics.userApiKeyEncrypted
    ));
    
    if (!client) {
      return fallback;
    }

    const model = metrics.userModel || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides actionable business insights. Keep each insight to one sentence. Be specific and practical.",
        },
        {
          role: "user",
          content: aiPrompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (content) {
      // Parse numbered list or newline-separated insights
      const parsed = content
        .split(/\n+/)
        .map(line => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter(line => line.length > 0)
        .slice(0, 3); // Max 3 insights
      
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error generating enhanced insights:", error);
  }

  return fallback;
}

/**
 * Generate AI next week focus (Standard tier)
 * Uses basic AI prompts
 */
export async function generateAINextWeekFocus(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  let template = "Maintain momentum and follow up on this week's conversations.";
  
  if (metrics.actionsCompleted === 0) {
    template = "Build momentum with 4 solid days of action.";
  } else if (metrics.actionsCompleted >= 10 && metrics.replies < 3) {
    template = "Revive 3 warm threads and follow up on recent conversations.";
  } else if (metrics.replies >= 3 && metrics.callsBooked === 0) {
    template = "Send clear CTAs and book at least 1 call.";
  } else if (metrics.replies >= 3 && metrics.callsBooked > 0) {
    template = "Close 2 warm opportunities and start 5 new conversations.";
  } else if (metrics.daysActive < 4) {
    template = "Build consistency with 4 active days this week.";
  }

  // Basic AI prompt for Standard tier
  const aiPrompt = `Suggest a focus for next week based on this week's results:
- ${metrics.actionsCompleted} actions completed
- ${metrics.daysActive} active days
- ${metrics.replies} replies received
- ${metrics.callsBooked} calls booked

Provide one clear, actionable focus statement for next week. Keep it to one sentence. Use this as inspiration: "${template}"`;

  const fallback = template;

  return await generateWithAI(
    aiPrompt,
    {
      actionsCompleted: metrics.actionsCompleted,
      daysActive: metrics.daysActive,
      replies: metrics.replies,
      callsBooked: metrics.callsBooked,
    },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

/**
 * Generate enhanced AI next week focus (Premium tier)
 * Uses enhanced prompts with more context
 */
export async function generateEnhancedAINextWeekFocus(
  metrics: WeeklySummaryMetrics,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  let template = "Maintain momentum and follow up on this week's conversations.";
  
  if (metrics.actionsCompleted === 0) {
    template = "Build momentum with 4 solid days of action.";
  } else if (metrics.actionsCompleted >= 10 && metrics.replies < 3) {
    template = "Revive 3 warm threads and follow up on recent conversations.";
  } else if (metrics.replies >= 3 && metrics.callsBooked === 0) {
    template = "Send clear CTAs and book at least 1 call.";
  } else if (metrics.replies >= 3 && metrics.callsBooked > 0) {
    template = "Close 2 warm opportunities and start 5 new conversations.";
  } else if (metrics.daysActive < 4) {
    template = "Build consistency with 4 active days this week.";
  }

  const replyRate = metrics.actionsCompleted > 0 
    ? Math.round((metrics.replies / metrics.actionsCompleted) * 100) 
    : 0;

  // Enhanced AI prompt for Premium tier
  const aiPrompt = `Suggest a strategic focus for next week based on this week's performance:
- ${metrics.actionsCompleted} actions completed across ${metrics.daysActive} days
- ${metrics.replies} replies received${replyRate > 0 ? ` (${replyRate}% reply rate)` : ""}
- ${metrics.callsBooked} calls booked
- Current streak: ${metrics.currentStreak} days

Provide a clear, strategic focus statement that:
- Builds on what's working
- Addresses areas for improvement
- Is specific and actionable
- Feels motivating

Keep it to one sentence. Use this as inspiration: "${template}"`;

  const fallback = template;

  return await generateWithAI(
    aiPrompt,
    {
      actionsCompleted: metrics.actionsCompleted,
      daysActive: metrics.daysActive,
      replies: metrics.replies,
      replyRate,
      callsBooked: metrics.callsBooked,
      currentStreak: metrics.currentStreak,
    },
    fallback,
    metrics.userAiProvider,
    metrics.userApiKeyEncrypted,
    metrics.userModel
  );
}

