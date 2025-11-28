import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateWinPost, generateInsightPost } from "@/lib/ai/content-prompts";

/**
 * POST /api/weekly-summaries/generate
 *
 * Generates a weekly summary for a given week.
 * Can be called manually or by a cron job.
 *
 * Query params:
 * - week_start_date (optional): YYYY-MM-DD format, defaults to Monday of current week
 * - user_id (optional): defaults to authenticated user
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get("week_start_date");

    // Calculate week start (Monday)
    let weekStartDate: Date;
    if (weekStartParam) {
      weekStartDate = new Date(weekStartParam);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - daysToMonday);
    }
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Check if summary already exists
    const weekStartStr = weekStartDate.toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("weekly_summaries")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStartStr)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Summary already exists for this week" },
        { status: 400 }
      );
    }

    // Calculate metrics
    // 1. Days active (days with completed actions)
    const { data: completedActions } = await supabase
      .from("actions")
      .select("completed_at")
      .eq("user_id", user.id)
      .in("state", ["DONE", "REPLIED", "SENT"])
      .gte("completed_at", weekStartDate.toISOString())
      .lte("completed_at", weekEndDate.toISOString())
      .not("completed_at", "is", null);

    const uniqueDays = new Set<string>();
    completedActions?.forEach((action) => {
      if (action.completed_at) {
        const date = new Date(action.completed_at).toISOString().split("T")[0];
        uniqueDays.add(date);
      }
    });
    const daysActive = uniqueDays.size;

    // 2. Actions completed
    const actionsCompleted = completedActions?.length || 0;

    // 3. Replies (actions marked as REPLIED)
    const { count: repliesCount } = await supabase
      .from("actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("state", "REPLIED")
      .gte("completed_at", weekStartDate.toISOString())
      .lte("completed_at", weekEndDate.toISOString());
    const replies = repliesCount || 0;

    // 4. Calls booked (placeholder - future feature)
    const callsBooked = 0;

    // 5. Get current streak and AI preferences from user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("streak_count, ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", user.id)
      .single();
    const currentStreak = userProfile?.streak_count || 0;

    // Generate narrative, insight, and next week focus (placeholders for now)
    const narrativeSummary = generateNarrativeSummary(
      daysActive,
      actionsCompleted,
      replies,
      callsBooked
    );

    const insightText = generateInsight(
      daysActive,
      actionsCompleted,
      replies,
      callsBooked
    );

    const nextWeekFocus = generateNextWeekFocus(
      daysActive,
      actionsCompleted,
      replies,
      callsBooked
    );

    // Create weekly summary
    const { data: summary, error: insertError } = await supabase
      .from("weekly_summaries")
      .insert({
        user_id: user.id,
        week_start_date: weekStartStr,
        days_active: daysActive,
        actions_completed: actionsCompleted,
        replies,
        calls_booked: callsBooked,
        insight_text: insightText,
        narrative_summary: narrativeSummary,
        next_week_focus: nextWeekFocus,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating weekly summary:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create weekly summary",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    // Generate content prompts if user completed ≥ 6 actions
    if (actionsCompleted >= 6) {
      await generateContentPrompts(supabase, user.id, summary.id, {
        daysActive,
        actionsCompleted,
        replies,
        callsBooked,
        insightText,
        userAiProvider: userProfile?.ai_provider,
        userApiKeyEncrypted: userProfile?.ai_api_key_encrypted,
        userModel: userProfile?.ai_model,
      });
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Weekly summary generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Placeholder narrative generation (will be replaced with AI)
function generateNarrativeSummary(
  daysActive: number,
  actionsCompleted: number,
  replies: number,
  callsBooked: number
): string {
  if (actionsCompleted === 0) {
    return "This week was quiet. Ready to build momentum next week?";
  }

  const parts: string[] = [];
  parts.push(
    `You completed ${actionsCompleted} action${
      actionsCompleted !== 1 ? "s" : ""
    } across ${daysActive} day${daysActive !== 1 ? "s" : ""} this week.`
  );

  if (replies > 0) {
    parts.push(`You received ${replies} repl${replies !== 1 ? "ies" : "y"}.`);
  }

  if (callsBooked > 0) {
    parts.push(
      `You booked ${callsBooked} call${callsBooked !== 1 ? "s" : ""}.`
    );
  }

  if (replies === 0 && callsBooked === 0 && actionsCompleted > 0) {
    parts.push("Keep the momentum going!");
  }

  return parts.join(" ");
}

// Placeholder insight generation (will be replaced with AI)
function generateInsight(
  daysActive: number,
  actionsCompleted: number,
  replies: number,
  callsBooked: number
): string {
  if (actionsCompleted === 0) {
    return "Start with small, consistent actions to build momentum.";
  }

  if (replies > 0 && actionsCompleted > 0) {
    const replyRate = (replies / actionsCompleted) * 100;
    if (replyRate >= 30) {
      return "Your follow-ups are getting strong engagement. Keep the momentum!";
    } else if (replyRate >= 15) {
      return "Your follow-ups are working. Consider following up sooner for even better results.";
    }
  }

  if (daysActive >= 5 && actionsCompleted >= 10) {
    return "You're building strong consistency. This rhythm will compound over time.";
  }

  if (daysActive < 3 && actionsCompleted > 0) {
    return "Focus on consistency—even 3-4 active days per week makes a big difference.";
  }

  return "Small actions add up. Keep the rhythm going.";
}

// Placeholder next week focus generation (will be replaced with AI)
function generateNextWeekFocus(
  daysActive: number,
  actionsCompleted: number,
  replies: number,
  callsBooked: number
): string {
  if (actionsCompleted === 0) {
    return "Build momentum with 4 solid days of action.";
  }

  if (actionsCompleted >= 10 && replies < 3) {
    return "Revive 3 warm threads and follow up on recent conversations.";
  }

  if (replies >= 3 && callsBooked === 0) {
    return "Send clear CTAs and book at least 1 call.";
  }

  if (replies >= 3 && callsBooked > 0) {
    return "Close 2 warm opportunities and start 5 new conversations.";
  }

  if (daysActive < 4) {
    return "Build consistency with 4 active days this week.";
  }

  return "Maintain momentum and follow up on this week's conversations.";
}

// Generate content prompts if user completed ≥ 6 actions
// Uses template + AI phrasing per PRD Section 8.2
async function generateContentPrompts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  weeklySummaryId: string,
  metrics: {
    daysActive: number;
    actionsCompleted: number;
    replies: number;
    callsBooked: number;
    insightText?: string;
    userAiProvider?: string | null;
    userApiKeyEncrypted?: string | null;
    userModel?: string | null;
  }
) {
  const prompts: Array<{ type: "WIN_POST" | "INSIGHT_POST"; content: string }> =
    [];

  // Generate WIN_POST if there's a win to celebrate
  // (calls booked, replies received, or high action count)
  if (
    metrics.callsBooked > 0 ||
    metrics.replies > 0 ||
    metrics.actionsCompleted >= 10
  ) {
    const winContent = await generateWinPost(metrics);
    if (winContent) {
      prompts.push({
        type: "WIN_POST",
        content: winContent,
      });
    }
  }

  // Generate INSIGHT_POST if there's an insight to share
  // (replies received or insight text available)
  if (metrics.replies > 0 || metrics.insightText) {
    const insightContent = await generateInsightPost(metrics);
    if (insightContent) {
      prompts.push({
        type: "INSIGHT_POST",
        content: insightContent,
      });
    }
  }

  // Insert prompts (max 2 per PRD Section 15.1)
  if (prompts.length > 0) {
    const promptsToInsert = prompts.slice(0, 2); // Ensure max 2 prompts
    await supabase.from("content_prompts").insert(
      promptsToInsert.map((prompt) => ({
        user_id: userId,
        weekly_summary_id: weeklySummaryId,
        type: prompt.type,
        content: prompt.content,
        status: "DRAFT",
      }))
    );
  }
}
