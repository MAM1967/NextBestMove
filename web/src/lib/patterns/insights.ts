import { generateWithAI } from "@/lib/ai/openai";
import type { UserPattern } from "./types";

interface InsightContext {
  userAiProvider?: string | null;
  userApiKeyEncrypted?: string | null;
  userModel?: string | null;
}

export async function attachInsightsToPatterns(
  patterns: UserPattern[],
  context: InsightContext
): Promise<UserPattern[]> {
  if (patterns.length === 0) {
    return [];
  }

  const enriched = await Promise.all(
    patterns.map(async (pattern) => {
      const fallback = buildFallbackInsight(pattern);
      const aiPrompt = buildAiPrompt(pattern, fallback);

      const insight = await generateWithAI(
        aiPrompt,
        {},
        fallback,
        context.userAiProvider,
        context.userApiKeyEncrypted,
        context.userModel
      );

      return {
        ...pattern,
        insight,
      };
    })
  );

  return enriched;
}

function buildFallbackInsight(pattern: UserPattern): string {
  switch (pattern.type) {
    case "day_of_week_performance": {
      const data = pattern.data as { bestDays: Array<{ day: string; replyRate: number }>; worstDays: Array<{ day: string; replyRate: number }> };
      const best = data.bestDays[0];
      if (!best) return "You're building consistent momentum across the week.";
      return `Your outreach on ${best.day} tends to get the best reply rates. Consider scheduling more important follow-ups on that day.`;
    }
    case "follow_up_timing": {
      const data = pattern.data as { buckets: Array<{ label: string; hoursMin: number; hoursMax: number | null; replyRate: number }> };
      const best = [...data.buckets].sort(
        (a, b) => b.replyRate - a.replyRate
      )[0];
      if (!best) return "Consistent follow-up timing is helping your replies.";
      return `Follow-ups sent around ${best.label} after first contact appear to perform best. Try to time more follow-ups in that window.`;
    }
    case "action_type_conversion": {
      const data = pattern.data as { entries: Array<{ actionType: string; replyRate: number }> };
      const best = [...data.entries].sort(
        (a, b) => b.replyRate - a.replyRate
      )[0];
      if (!best) return "Your mix of outreach and follow-ups is working steadily.";
      return `${best.actionType} actions are currently driving the highest reply rates. Make sure your daily plan includes enough of them.`;
    }
    case "warm_reengagement": {
      const data = pattern.data as { reengagedCount: number; successRate: number };
      if (data.successRate <= 0) {
        return "Reaching back out to older contacts is starting to pay off—keep reviving a few each week.";
      }
      return `Re-engaging warm contacts is working: about ${Math.round(
        data.successRate * 100
      )}% of your revival attempts lead to positive movement. Lean on those relationships.`;
    }
    default:
      return "Your activity is starting to show clear patterns you can lean into.";
  }
}

function buildAiPrompt(pattern: UserPattern, fallback: string): string {
  return `
You are analyzing sales activity patterns for a solo consultant.

Pattern type: ${pattern.type}
Raw data (JSON): ${JSON.stringify(pattern.data)}

Write 1-2 short sentences explaining this pattern in plain language.
Keep it specific, positive, and practical. Avoid jargon.
If unsure, echo and lightly refine this baseline insight: "${fallback}".
`;
}


