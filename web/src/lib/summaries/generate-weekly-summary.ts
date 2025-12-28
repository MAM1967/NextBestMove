import type { SupabaseClient } from "@supabase/supabase-js";
import { generateWinPost, generateInsightPost } from "@/lib/ai/content-prompts";

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
  supabase: SupabaseClient,
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
    const winContent = await generateWinPost(metrics, supabase, userId);
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
    const insightContent = await generateInsightPost(metrics, supabase, userId);
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
    const { data: insertedPrompts, error: insertError } = await supabase
      .from("content_prompts")
      .insert(
        promptsToInsert.map((prompt) => ({
          user_id: userId,
          weekly_summary_id: weeklySummaryId,
          type: prompt.type,
          content: prompt.content,
          status: "DRAFT",
        }))
      )
      .select();

    if (insertError) {
      console.error("Error inserting content prompts:", insertError);
      return; // Don't create actions if prompts failed
    }

    // Convert content prompts to CONTENT actions
    // Spread across week: WIN_POST → Monday, INSIGHT_POST → Wednesday
    // If only one prompt → Monday
    if (insertedPrompts && insertedPrompts.length > 0) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate Monday (if today is Sunday, Monday is tomorrow; otherwise, find this week's Monday)
      const monday = new Date(today);
      if (dayOfWeek === 0) {
        // Sunday: Monday is tomorrow
        monday.setDate(today.getDate() + 1);
      } else {
        // Monday-Saturday: Go back to this week's Monday
        monday.setDate(today.getDate() - (dayOfWeek - 1));
      }
      monday.setHours(0, 0, 0, 0);

      // Calculate Wednesday (3 days after Monday)
      const wednesday = new Date(monday);
      wednesday.setDate(monday.getDate() + 2);
      wednesday.setHours(0, 0, 0, 0);

      for (let i = 0; i < insertedPrompts.length; i++) {
        const prompt = insertedPrompts[i];
        let dueDate: Date;

        if (insertedPrompts.length === 1) {
          // Only one prompt → Monday
          dueDate = monday;
        } else {
          // Two prompts: WIN_POST → Monday, INSIGHT_POST → Wednesday
          dueDate = prompt.type === "WIN_POST" ? monday : wednesday;
        }

        // Check if CONTENT action already exists for this prompt
        const { data: existingAction } = await supabase
          .from("actions")
          .select("id")
          .eq("user_id", userId)
          .eq("action_type", "CONTENT")
          .eq("state", "NEW")
          .eq("due_date", dueDate.toISOString().split("T")[0])
          .maybeSingle();

        if (!existingAction) {
          // Create CONTENT action
          await supabase.from("actions").insert({
            user_id: userId,
            action_type: "CONTENT",
            state: "NEW",
            due_date: dueDate.toISOString().split("T")[0],
            description: prompt.type === "WIN_POST" 
              ? "Create a win post from this week's summary"
              : "Create an insight post from this week's summary",
            notes: `Auto-created from weekly summary content prompt. Draft: ${prompt.content.substring(0, 200)}${prompt.content.length > 200 ? "..." : ""}`,
            auto_created: true,
          });
        }
      }
    }
  }
}

/**
 * Generate a weekly summary for a specific user and week.
 * This function can be called from both authenticated endpoints and cron jobs.
 */
export async function generateWeeklySummaryForUser(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: Date | string
): Promise<{ success: boolean; error?: string; summary?: any }> {
  try {
    // Normalize weekStartDate to Date
    const weekStart = typeof weekStartDate === "string" 
      ? new Date(weekStartDate) 
      : weekStartDate;
    weekStart.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekStart.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Check if summary already exists
    const { data: existing } = await supabase
      .from("weekly_summaries")
      .select("id")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartStr)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Summary already exists for this week" };
    }

    // Calculate metrics
    // 1. Days active (days with completed actions)
    const { data: completedActions } = await supabase
      .from("actions")
      .select("completed_at")
      .eq("user_id", userId)
      .in("state", ["DONE", "REPLIED", "SENT"])
      .gte("completed_at", weekStart.toISOString())
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
      .eq("user_id", userId)
      .eq("state", "REPLIED")
      .gte("completed_at", weekStart.toISOString())
      .lte("completed_at", weekEndDate.toISOString());
    const replies = repliesCount || 0;

    // 4. Calls booked (placeholder - future feature)
    const callsBooked = 0;

    // 5. Get current streak and AI preferences from user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("streak_count, ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", userId)
      .single();
    const currentStreak = userProfile?.streak_count || 0;

    // Generate narrative, insight, and next week focus
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
        user_id: userId,
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
      return {
        success: false,
        error: `Failed to create weekly summary: ${insertError.message}`,
      };
    }

    // Generate content prompts if user completed ≥ 6 actions
    if (actionsCompleted >= 6) {
      await generateContentPrompts(supabase, userId, summary.id, {
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

    return { success: true, summary };
  } catch (error) {
    console.error("Weekly summary generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

