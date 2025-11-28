import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/users/email-preferences
 * Update user's email preferences
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    email_morning_plan,
    email_fast_win_reminder,
    email_follow_up_alerts,
    email_weekly_summary,
  } = body;

  // Validate all fields are booleans
  if (
    typeof email_morning_plan !== "boolean" ||
    typeof email_fast_win_reminder !== "boolean" ||
    typeof email_follow_up_alerts !== "boolean" ||
    typeof email_weekly_summary !== "boolean"
  ) {
    return NextResponse.json(
      { error: "All preferences must be boolean values" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({
      email_morning_plan,
      email_fast_win_reminder,
      email_follow_up_alerts,
      email_weekly_summary,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

