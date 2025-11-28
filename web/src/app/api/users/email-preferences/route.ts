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
    email_unsubscribed,
  } = body;

  // Validate all fields are booleans
  if (
    typeof email_morning_plan !== "boolean" ||
    typeof email_fast_win_reminder !== "boolean" ||
    typeof email_follow_up_alerts !== "boolean" ||
    typeof email_weekly_summary !== "boolean" ||
    (email_unsubscribed !== undefined && typeof email_unsubscribed !== "boolean")
  ) {
    return NextResponse.json(
      { error: "All preferences must be boolean values" },
      { status: 400 }
    );
  }

  const updateData: any = {
    email_morning_plan,
    email_fast_win_reminder,
    email_follow_up_alerts,
    email_weekly_summary,
  };

  if (email_unsubscribed !== undefined) {
    updateData.email_unsubscribed = email_unsubscribed;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
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

