import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/daily-plans - Get daily plan for authenticated user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch daily plan
    const { data: dailyPlan, error: planError } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .single();

    if (planError) {
      if (planError.code === "PGRST116") {
        // No plan found - return 404
        return NextResponse.json(
          { error: "No plan found for this date" },
          { status: 404 }
        );
      }
      console.error("Error fetching daily plan:", planError);
      return NextResponse.json(
        { error: "Failed to fetch daily plan" },
        { status: 500 }
      );
    }

    // Fetch actions for this plan
    const { data: planActions, error: actionsError } = await supabase
      .from("daily_plan_actions")
      .select("action_id, is_fast_win, position")
      .eq("daily_plan_id", dailyPlan.id)
      .order("position", { ascending: true });

    if (actionsError) {
      console.error("Error fetching plan actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch plan actions" },
        { status: 500 }
      );
    }

    // Fetch action details separately
    const actions: any[] = [];
    let fastWin: any = null;

    if (planActions && planActions.length > 0) {
      const actionIds = planActions.map((pa) => pa.action_id);
      
      // Fetch all actions
      const { data: actionsData, error: actionsDataError } = await supabase
        .from("actions")
        .select("*")
        .eq("user_id", user.id)
        .in("id", actionIds);

      if (actionsDataError) {
        console.error("Error fetching action details:", actionsDataError);
        return NextResponse.json(
          { error: "Failed to fetch action details" },
          { status: 500 }
        );
      }

      // Create a map of action_id -> action data
      const actionsMap = new Map(
        (actionsData || []).map((action) => [action.id, action])
      );

      // Fetch leads for actions that have person_id
      const personIds = [
        ...new Set(
          (actionsData || [])
            .map((a) => a.person_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      let leadsMap = new Map<string, any>();
      if (personIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, name, linkedin_url, email, phone_number, url, notes")
          .eq("user_id", user.id)
          .in("id", personIds);

        if (leadsData) {
          leadsMap = new Map(leadsData.map((lead) => [lead.id, lead]));
        }
      }

      // Transform the data
      for (const planAction of planActions) {
        const actionData = actionsMap.get(planAction.action_id);
        if (actionData) {
          const lead = actionData.person_id
            ? leadsMap.get(actionData.person_id)
            : null;

          const action = {
            ...actionData,
            leads: lead ? [lead] : null, // Match expected format
          };

          if (planAction.is_fast_win) {
            fastWin = action;
          } else {
            actions.push(action);
          }
        }
      }
    }

    return NextResponse.json({
      dailyPlan: {
        ...dailyPlan,
        actions: actions, // Only regular actions, fast_win is separate
        fast_win: fastWin,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

