import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/create-nurture-actions
 * 
 * Cron job to automatically create NURTURE actions for leads that haven't been contacted in 21+ days.
 * Runs daily at 1 AM UTC.
 * 
 * This endpoint is called by cron-job.org and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, "");
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, "");

    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get all active users
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, last_action_date")
      .neq("tier", "free"); // Skip Free tier users

    if (usersError) {
      console.error("[Cron NURTURE] Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
        processed: 0,
        created: 0,
      });
    }

    let processedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];
    const today = new Date().toISOString().split("T")[0];

    // Process each user
    for (const user of users) {
      try {
        processedCount++;

        // Flood protection: Skip if user inactive 7+ days
        if (user.last_action_date) {
          const lastActionDate = new Date(user.last_action_date);
          const daysSinceLastAction =
            (new Date().getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceLastAction >= 7) {
            skippedCount++;
            continue; // Skip NURTURE for inactive users (prioritize FOLLOW_UP/OUTREACH)
          }
        }

        // Get all ACTIVE leads for this user
        const { data: leads, error: leadsError } = await adminClient
          .from("leads")
          .select("id, name, status")
          .eq("user_id", user.id)
          .eq("status", "ACTIVE");

        if (leadsError || !leads || leads.length === 0) {
          continue;
        }

        // For each lead, find most recent action (any type, any state)
        const leadIds = leads.map((l) => l.id);
        const { data: recentActions, error: actionsError } = await adminClient
          .from("actions")
          .select("person_id, completed_at, state, action_type")
          .eq("user_id", user.id)
          .in("person_id", leadIds)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });

        if (actionsError) {
          console.error(`[Cron NURTURE] Error fetching actions for user ${user.id}:`, actionsError);
          continue;
        }

        // Build map of most recent action per lead
        const lastActionMap = new Map<string, Date>();
        if (recentActions) {
          for (const action of recentActions) {
            if (!action.person_id || !action.completed_at) continue;
            if (!lastActionMap.has(action.person_id)) {
              lastActionMap.set(action.person_id, new Date(action.completed_at));
            }
          }
        }

        // Find leads that haven't been contacted in 21+ days (or never contacted)
        const eligibleLeads: Array<{
          leadId: string;
          leadName: string;
          daysSinceContact: number;
          lastActionDate: Date | null;
          replyRate?: number;
        }> = [];

        for (const lead of leads) {
          const lastActionDate = lastActionMap.get(lead.id);
          let daysSinceContact = Infinity;

          if (lastActionDate) {
            daysSinceContact =
              (new Date().getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24);
          }

          // Include leads with no contact or 21+ days since last contact
          if (daysSinceContact >= 21 || !lastActionDate) {
            // Calculate reply rate for prioritization
            const { data: leadActions } = await adminClient
              .from("actions")
              .select("state, action_type")
              .eq("user_id", user.id)
              .eq("person_id", lead.id);

            const totalActions = leadActions?.length || 0;
            const repliedActions =
              leadActions?.filter((a) => a.state === "REPLIED").length || 0;
            const replyRate = totalActions > 0 ? repliedActions / totalActions : 0;

            eligibleLeads.push({
              leadId: lead.id,
              leadName: lead.name,
              daysSinceContact: daysSinceContact === Infinity ? 999 : daysSinceContact,
              lastActionDate: lastActionDate || null,
              replyRate,
            });
          }
        }

        // Check if NURTURE already exists for any of these leads
        const eligibleLeadIds = eligibleLeads.map((l) => l.leadId);
        const { data: existingNurtureActions } = await adminClient
          .from("actions")
          .select("person_id")
          .eq("user_id", user.id)
          .in("person_id", eligibleLeadIds)
          .eq("action_type", "NURTURE")
          .in("state", ["NEW", "SNOOZED"]);

        const existingNurtureLeadIds = new Set(
          existingNurtureActions?.map((a) => a.person_id) || []
        );

        // Filter out leads that already have NURTURE actions
        const leadsNeedingNurture = eligibleLeads.filter(
          (l) => !existingNurtureLeadIds.has(l.leadId)
        );

        // Prioritize: Sort by engagement history
        // 1. Most recent engagement (recent replies)
        // 2. Highest historical reply rate
        // 3. Shortest time since last contact
        leadsNeedingNurture.sort((a, b) => {
          // First: prioritize by reply rate (higher is better)
          if (b.replyRate !== a.replyRate) {
            return (b.replyRate || 0) - (a.replyRate || 0);
          }
          // Second: prioritize by shorter time since contact (more recent is better)
          return a.daysSinceContact - b.daysSinceContact;
        });

        // Limit to top 3 leads per day (flood protection)
        const topLeads = leadsNeedingNurture.slice(0, 3);

        // Check max pending actions limit (15 per user)
        const { data: pendingActions } = await adminClient
          .from("actions")
          .select("id")
          .eq("user_id", user.id)
          .in("state", ["NEW", "SNOOZED"]);

        const pendingCount = pendingActions?.length || 0;
        const remainingSlots = Math.max(0, 15 - pendingCount);

        // Create NURTURE actions (up to remaining slots or 3, whichever is smaller)
        const leadsToCreate = topLeads.slice(0, Math.min(remainingSlots, 3));

        for (const lead of leadsToCreate) {
          // Create NURTURE action
          const { error: createError } = await adminClient.from("actions").insert({
            user_id: user.id,
            person_id: lead.leadId,
            action_type: "NURTURE",
            state: "NEW",
            due_date: today,
            auto_created: true,
            notes: `No contact with ${lead.leadName} in ${Math.round(lead.daysSinceContact)} days`,
            description: `Nurture relationship with ${lead.leadName}`,
          });

          if (createError) {
            console.error(
              `[Cron NURTURE] Error creating action for user ${user.id}, lead ${lead.leadId}:`,
              createError
            );
            errorCount++;
            errors.push({ userId: user.id, error: createError.message });
          } else {
            createdCount++;
          }
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`[Cron NURTURE] Error processing user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Cron NURTURE] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

