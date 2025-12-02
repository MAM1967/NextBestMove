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

    let query = supabase
      .from("actions")
      .select(
        `
        *,
        person_pins (
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

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching actions:", error);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ actions: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}






