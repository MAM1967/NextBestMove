import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { shouldDowngradeToFree, updateUserTier } from "@/lib/billing/tier";
import { headers } from "next/headers";

/**
 * POST /api/cron/downgrade-to-free
 * 
 * Daily cron job to automatically downgrade users to Free tier on Day 15
 * (when their 14-day Standard trial ends and they haven't upgraded).
 * 
 * Authentication: CRON_SECRET or CRON_JOB_ORG_API_KEY
 */
export async function POST(request: Request) {
  try {
    // Authenticate cron request
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const secretParam = new URL(request.url).searchParams.get("secret");
    
    const cronSecret = process.env.CRON_SECRET?.trim();
    const cronJobOrgKey = process.env.CRON_JOB_ORG_API_KEY?.trim();
    
    const providedSecret = authHeader?.replace("Bearer ", "").trim() || secretParam?.trim();
    
    if (!providedSecret || (providedSecret !== cronSecret && providedSecret !== cronJobOrgKey)) {
      console.error("Unauthorized cron request to downgrade-to-free");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    // Find all users with ended trials who should be downgraded
    // Query: users with trialing subscriptions where trial_ends_at < now
    // AND no active paid subscription exists
    const { data: usersToDowngrade, error: queryError } = await supabase
      .from("billing_customers")
      .select(`
        user_id,
        id,
        billing_subscriptions!inner (
          id,
          status,
          trial_ends_at
        )
      `)
      .eq("billing_subscriptions.status", "trialing")
      .not("billing_subscriptions.trial_ends_at", "is", null)
      .lt("billing_subscriptions.trial_ends_at", new Date().toISOString());

    if (queryError) {
      console.error("Error querying users to downgrade:", queryError);
      return NextResponse.json(
        { error: "Failed to query users", details: queryError.message },
        { status: 500 }
      );
    }

    if (!usersToDowngrade || usersToDowngrade.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to downgrade",
        count: 0,
      });
    }

    let downgradedCount = 0;
    let errorCount = 0;

    for (const customer of usersToDowngrade) {
      try {
        const userId = customer.user_id;
        
        // Check if should downgrade (verifies no active subscription exists)
        const shouldDowngrade = await shouldDowngradeToFree(supabase, userId);
        
        if (shouldDowngrade) {
          // Update tier to Free
          await updateUserTier(supabase, userId);
          downgradedCount++;
          
          console.log(`Downgraded user ${userId} to Free tier (trial ended)`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`Error downgrading user ${customer.user_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${usersToDowngrade.length} users`,
      downgraded: downgradedCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error("Fatal error in downgrade-to-free cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

