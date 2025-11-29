import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/content-prompts - List all saved content prompts for the user
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
    const status = searchParams.get("status"); // Optional filter: DRAFT, POSTED, ARCHIVED
    const type = searchParams.get("type"); // Optional filter: WIN_POST, INSIGHT_POST

    let query = supabase
      .from("content_prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching content prompts:", error);
      return NextResponse.json(
        { error: "Failed to fetch content prompts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompts: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

