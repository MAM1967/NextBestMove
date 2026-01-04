import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { mapStatusToStates } from "@/lib/actions/status-mapping";
import type { ActionSource, ActionIntentType } from "@/app/app/actions/types";

/**
 * GET /api/actions/filtered
 * 
 * Fetch actions with filtering support for the new Actions page views.
 * Supports Due View and Relationships View with comprehensive filtering.
 */
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
    const view = searchParams.get("view") as 'due' | 'relationships' || 'due';
    const statusParam = searchParams.get("status");
    const sourceParam = searchParams.get("source");
    const intentTypeParam = searchParams.get("intent_type");
    const relationshipId = searchParams.get("relationship_id");
    const dueFilter = searchParams.get("due_filter") as 'overdue' | 'today' | 'next_7_days' | 'this_month' | 'none' | 'all' || 'all';

    // Build query
    let query = supabase
      .from("actions")
      .select(`
        *,
        leads (
          id,
          name,
          linkedin_url,
          email,
          phone_number,
          url,
          notes,
          status,
          tier,
          relationship_state
        )
      `)
      .eq("user_id", user.id)
      .neq("state", "ARCHIVED"); // Exclude archived by default

    // Status filter
    if (statusParam) {
      const statuses = statusParam.split(',').filter(Boolean);
      const states = statuses.flatMap(s => mapStatusToStates(s as any));
      if (states.length > 0) {
        query = query.in("state", states);
      }
    }

    // Source filter
    if (sourceParam) {
      const sources = sourceParam.split(',').filter(Boolean) as ActionSource[];
      if (sources.length > 0) {
        query = query.in("source", sources);
      }
    }

    // Intent type filter
    if (intentTypeParam) {
      const intentTypes = intentTypeParam.split(',').filter(Boolean) as ActionIntentType[];
      if (intentTypes.length > 0) {
        query = query.in("intent_type", intentTypes);
      }
    }

    // Relationship filter
    if (relationshipId) {
      query = query.eq("person_id", relationshipId);
    }

    // Due date filter (for Due view)
    if (view === 'due' && dueFilter !== 'all') {
      const today = new Date().toISOString().split("T")[0];
      switch (dueFilter) {
        case 'overdue':
          query = query.lt("due_date", today);
          break;
        case 'today':
          query = query.eq("due_date", today);
          break;
        case 'next_7_days':
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          query = query.gte("due_date", today).lte("due_date", nextWeek.toISOString().split("T")[0]);
          break;
        case 'this_month':
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
          query = query.gte("due_date", startOfMonth.toISOString().split("T")[0])
            .lte("due_date", endOfMonth.toISOString().split("T")[0]);
          break;
        case 'none':
          // Schema requires due_date, so this would need special handling
          // For now, return empty result
          return NextResponse.json({ actions: [] });
      }
    }

    // Order by due date (ascending) then created date (descending)
    query = query.order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    const { data: actions, error } = await query;

    if (error) {
      console.error("Error fetching filtered actions:", error);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ actions: actions || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

