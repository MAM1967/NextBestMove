import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/users/timezone
 * Update user's timezone preference
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
  const { timezone } = body;

  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json(
      { error: "Timezone is required and must be a string" },
      { status: 400 }
    );
  }

  // Validate timezone format (basic check - should be IANA timezone)
  if (!timezone.includes("/")) {
    return NextResponse.json(
      { error: "Invalid timezone format. Use IANA timezone (e.g., America/New_York)" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ timezone })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating timezone:", error);
    return NextResponse.json(
      { error: "Failed to update timezone" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, timezone });
}

