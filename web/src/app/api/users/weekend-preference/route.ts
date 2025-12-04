import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/users/weekend-preference
 * 
 * Updates the user's weekend exclusion preference.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { exclude_weekends } = body;

    if (typeof exclude_weekends !== "boolean") {
      return NextResponse.json(
        { error: "exclude_weekends must be a boolean" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("users")
      .update({ exclude_weekends })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating weekend preference:", error);
      return NextResponse.json(
        { error: "Failed to update weekend preference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, exclude_weekends });
  } catch (error: any) {
    console.error("Error updating weekend preference:", error);
    return NextResponse.json(
      { error: "Failed to update weekend preference" },
      { status: 500 }
    );
  }
}







