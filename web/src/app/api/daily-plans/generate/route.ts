import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateDailyPlanForUser } from "@/lib/plans/generate-daily-plan";
import { canGeneratePlans } from "@/lib/billing/subscription-status";
import { getUserTier } from "@/lib/billing/tier";
import { logError } from "@/lib/utils/logger";
import { withResponseTime } from "@/lib/middleware/response-time";

/**
 * POST /api/daily-plans/generate - Generate a daily plan
 * 
 * Authenticated endpoint for users to generate their daily plan.
 * Can also regenerate by deleting existing plan first.
 */
async function handler(request: Request) {
  // Declare variables at function scope for use in catch block
  let user: { id: string } | null = null;
  let date: string | null = null;
  let isInOnboarding = false;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = authUser;

    // Check if user is still in onboarding - allow plan generation during onboarding
    // Also get timezone for date calculation
    const { data: userProfile } = await supabase
      .from("users")
      .select("onboarding_completed, timezone")
      .eq("id", user.id)
      .single();

    isInOnboarding = !userProfile?.onboarding_completed;
    const userTimezone = userProfile?.timezone || "America/New_York";

    // If not in onboarding, check subscription status and grace period
    if (!isInOnboarding) {
      const { data: billingCustomer } = await supabase
        .from("billing_customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null = null;
      let trialEndsAt: string | null = null;

      if (billingCustomer) {
        const { data: subscription } = await supabase
          .from("billing_subscriptions")
          .select("status, trial_ends_at")
          .eq("billing_customer_id", billingCustomer.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscription) {
          subscriptionStatus = subscription.status;
          trialEndsAt = subscription.trial_ends_at;
        }
      }

      // Check tier for Free tier users (manual generation is allowed for Free tier)
      const userTier = await getUserTier(supabase, user.id);
      
      // Free tier: allow manual generation (this endpoint is for manual generation)
      // But block automatic generation via cron (handled in cron job)
      if (userTier === "free") {
        // Free tier users can generate manually, but show upgrade prompt
        // (We'll allow the generation but could show a banner in UI)
      } else {
        // For Standard/Premium, check subscription status
        if (!await canGeneratePlans(subscriptionStatus, trialEndsAt, userTier)) {
          return NextResponse.json(
            { 
              error: "Your Standard trial has ended. Upgrade to Standard to unlock automatic daily plans, or use manual planning on the Free tier.",
              gracePeriod: true 
            },
            { status: 403 }
          );
        }
      }
    }
    
    const body = await request.json();
    // ALWAYS use user's timezone to get today's date, ignore client-provided date
    // This prevents timezone mismatches where client sends UTC date but user is in different timezone
    const { getTodayInTimezone } = await import("@/lib/utils/dateUtils");
    date = getTodayInTimezone(userTimezone); // Always calculate from user's timezone, ignore body.date

    // Check if plan already exists for this date - if so, delete it to allow regeneration
    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existingPlan) {
      // Delete existing plan and its actions to allow regeneration
      // Note: daily_plan_actions will be deleted automatically via CASCADE
      const { error: deleteError } = await supabase
        .from("daily_plans")
        .delete()
        .eq("id", existingPlan.id);

      if (deleteError) {
        console.error("Error deleting existing plan:", deleteError);
        return NextResponse.json(
          { error: "Failed to regenerate plan" },
          { status: 500 }
        );
      }
    }

    // Use shared generation function
    const result = await generateDailyPlanForUser(supabase, user.id, date);

    if (!result.success) {
      // For onboarding, return graceful error that allows user to continue
      // Check if user is in onboarding
      if (isInOnboarding) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Could not generate plan. You can continue without it.",
            allowContinue: true,
          },
          { status: 200 } // Return 200 so frontend can handle gracefully
        );
      }
      
      // For non-onboarding users, return error status
      return NextResponse.json(
        { error: result.error || "Failed to generate plan" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dailyPlan: result.dailyPlan,
    });
  } catch (error) {
    // Log error for monitoring
    logError("Unexpected error generating plan", error, {
      userId: user?.id,
      date,
      isInOnboarding,
    });

    // For onboarding, return graceful error
    if (isInOnboarding) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not generate plan right now. You can continue without it and generate it later.",
          allowContinue: true,
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }

    // For non-onboarding users, return error
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withResponseTime(handler);
