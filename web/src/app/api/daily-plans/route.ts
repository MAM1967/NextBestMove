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
      .select(
        `
        action_id,
        is_fast_win,
        position,
        actions (
          *,
          leads (
            id,
            name,
            url,
            notes
          )
        )
      `
      )
      .eq("daily_plan_id", dailyPlan.id)
      .order("position", { ascending: true });

    if (actionsError) {
      console.error("Error fetching plan actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch plan actions" },
        { status: 500 }
      );
    }

    // Transform the data
    type ActionWithLeads = {
      id: string;
      action_type: string;
      state: string;
      description?: string;
      due_date: string;
      leads?: Array<{ id: string; name: string; url?: string; notes?: string }> | null;
      [key: string]: unknown;
    };
    const actions: ActionWithLeads[] = [];
    let fastWin: ActionWithLeads | null = null;

    if (planActions) {
      for (const planAction of planActions) {
        // planAction.actions is a single object from Supabase relation, not an array
        const actionData = Array.isArray(planAction.actions) 
          ? (planAction.actions[0] as ActionWithLeads | undefined)
          : (planAction.actions as ActionWithLeads | null);
        if (actionData) {
          const action = {
            ...actionData,
            leads: actionData.leads || [], // Use leads property name after migration
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

