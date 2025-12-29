import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCalendarStatus } from "@/lib/calendar/status";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await fetchCalendarStatus(supabase, user.id);
  return NextResponse.json(status);
}















