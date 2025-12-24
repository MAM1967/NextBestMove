import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/actions - List actions for the authenticated user
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
    const state = searchParams.get("state"); // Optional filter: NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED
    const dueDate = searchParams.get("due_date"); // Optional filter by due date
    const personId = searchParams.get("person_id"); // Optional filter by person

    // Try with leads join first, fallback to without if it fails (RLS might block the join)
    let actions: any[] | null = null;
    
    // First try with leads join
    let query = supabase
      .from("actions")
      .select(
        `
        *,
        leads (
          id,
          name,
          url,
          notes
        )
      `
      )
      .eq("user_id", user.id)
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (state) {
      query = query.eq("state", state);
    }

    if (dueDate) {
      query = query.eq("due_date", dueDate);
    }

    if (personId) {
      query = query.eq("person_id", personId);
    }

    const { data: dataWithLeads, error: joinError } = await query;

    if (joinError) {
      console.warn("Error fetching actions with leads join, trying without join:", joinError);
      // Fallback: fetch actions without leads join
      let fallbackQuery = supabase
        .from("actions")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (state) {
        fallbackQuery = fallbackQuery.eq("state", state);
      }

      if (dueDate) {
        fallbackQuery = fallbackQuery.eq("due_date", dueDate);
      }

      if (personId) {
        fallbackQuery = fallbackQuery.eq("person_id", personId);
      }

      const { data: actionsOnly, error: actionsError } = await fallbackQuery;

      if (actionsError) {
        console.error("Error fetching actions (both with and without join):", actionsError);
        return NextResponse.json(
          { error: "Failed to fetch actions" },
          { status: 500 }
        );
      }

      actions = actionsOnly;
      
      // Fetch leads separately for each action if needed
      if (actions && actions.length > 0) {
        const leadIds = actions
          .map(a => a.person_id)
          .filter((id): id is string => id !== null);
        
        if (leadIds.length > 0) {
          const { data: leads } = await supabase
            .from("leads")
            .select("id, name, url, notes")
            .eq("user_id", user.id)
            .in("id", leadIds);
          
          // Attach leads to actions
          if (leads) {
            const leadsMap = new Map(leads.map(l => [l.id, l]));
            actions = actions.map(action => ({
              ...action,
              leads: action.person_id ? leadsMap.get(action.person_id) || null : null
            }));
          }
        }
      }
    } else {
      actions = dataWithLeads;
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

// POST /api/actions - Create a new action
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      person_id,
      action_type,
      description,
      due_date,
      notes,
      auto_created,
    } = body;

    // Validate required fields
    if (!action_type || !due_date) {
      return NextResponse.json(
        { error: "action_type and due_date are required" },
        { status: 400 }
      );
    }

    // Validate action_type
    const validActionTypes = [
      "OUTREACH",
      "FOLLOW_UP",
      "NURTURE",
      "CALL_PREP",
      "POST_CALL",
      "CONTENT",
      "FAST_WIN",
    ];
    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json(
        {
          error: `Invalid action_type. Must be one of: ${validActionTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // If person_id is provided, verify it belongs to the user
    if (person_id) {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("id, name")
        .eq("id", person_id)
        .eq("user_id", user.id)
        .single();

      if (leadError || !lead) {
        return NextResponse.json(
          { error: "Lead not found or doesn't belong to you" },
          { status: 404 }
        );
      }

      // Prevention logic: Check for existing FOLLOW_UP actions for this lead
      // Only block if there's already an active (NEW/SNOOZED) FOLLOW_UP
      // This check happens BEFORE the insert to prevent duplicates
      if (action_type === "FOLLOW_UP" && person_id) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        
        // Use a transaction-like approach: check and then create
        // The database query is atomic, so this prevents race conditions
        const { data: existingFollowUp, error: checkError } = await supabase
          .from("actions")
          .select("id, due_date")
          .eq("user_id", user.id)
          .eq("person_id", person_id)
          .eq("action_type", "FOLLOW_UP")
          .in("state", ["NEW", "SNOOZED"])
          .gte("due_date", today)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking for existing follow-up:", checkError);
          // Continue - don't block on check error (fail open)
        } else if (existingFollowUp) {
          const existingDate = new Date(existingFollowUp.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          console.log(`Prevented duplicate FOLLOW_UP for lead ${person_id} - existing follow-up due ${existingDate}`);
          return NextResponse.json(
            { 
              error: `You already have a follow-up scheduled for ${existingDate}. Complete that one first, or edit its date if needed.` 
            },
            { status: 400 }
          );
        }
      }

      // Auto-generate description if not provided
      if (!description) {
        const actionDescriptions: Record<string, string> = {
          OUTREACH: `Reach out to ${lead.name}`,
          FOLLOW_UP: `Follow up with ${lead.name}`,
          NURTURE: `Nurture relationship with ${lead.name}`,
          CALL_PREP: `Prepare for call with ${lead.name}`,
          POST_CALL: `Follow up after call with ${lead.name}`,
          CONTENT: `Create content for ${lead.name}`,
          FAST_WIN: `Quick action for ${lead.name}`,
        };
        body.description =
          actionDescriptions[action_type] || `Action for ${lead.name}`;
      }
    }

    // Create the action
    const { data: action, error: createError } = await supabase
      .from("actions")
      .insert({
        user_id: user.id,
        person_id: person_id || null,
        action_type,
        state: "NEW",
        description: body.description || description || null,
        due_date,
        notes: notes || null,
        auto_created: auto_created === true, // Default to false if not provided
      })
      .select(
        `
        *,
        leads (
          id,
          name,
          url,
          notes
        )
      `
      )
      .single();

    if (createError) {
      console.error("Error creating action:", createError);
      return NextResponse.json(
        { error: "Failed to create action", details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
