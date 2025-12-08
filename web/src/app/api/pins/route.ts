import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkPinLimit } from "@/lib/billing/subscription";

// GET /api/pins - List all pins for the authenticated user
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
    const status = searchParams.get("status"); // Optional filter: ACTIVE, SNOOZED, ARCHIVED

    let query = supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching pins:", error);
      return NextResponse.json(
        { error: "Failed to fetch pins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pins: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/pins - Create a new pin
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
    const { name, url, notes } = body;

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Normalize URL - auto-add mailto: for email addresses
    let normalizedUrl = url.trim();
    if (
      normalizedUrl.includes("@") &&
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://") &&
      !normalizedUrl.startsWith("mailto:")
    ) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(normalizedUrl)) {
        normalizedUrl = `mailto:${normalizedUrl}`;
      }
    }

    // Validate URL format (must be https://, http://, or mailto:)
    if (
      !normalizedUrl.startsWith("https://") &&
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("mailto:")
    ) {
      return NextResponse.json(
        { error: "Please enter a valid URL (https://...) or email address" },
        { status: 400 }
      );
    }

    // Check pin limit before creating
    const limitInfo = await checkPinLimit(user.id);
    if (!limitInfo.canAdd) {
      return NextResponse.json(
        {
          error: "Pin limit reached",
          message: `You've reached your limit of ${limitInfo.limit} pins on the ${limitInfo.plan === "premium" ? "Premium" : "Standard"} plan. Upgrade to Premium for unlimited pins.`,
          limitInfo,
        },
        { status: 403 }
      );
    }

    const { data: pin, error: pinError } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name: name.trim(),
        url: normalizedUrl,
        notes: notes?.trim() || null,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (pinError) {
      console.error("Error creating pin:", pinError);
      return NextResponse.json(
        { error: "Failed to create pin" },
        { status: 500 }
      );
    }

    // Automatically create an OUTREACH action for the new pin
    // This is core to the app's purpose: turn leads (pins) into revenue (actions)
    // Check if there's already an OUTREACH action for this pin (shouldn't happen for new pins, but safety check)
    const { data: existingAction } = await supabase
      .from("actions")
      .select("id")
      .eq("user_id", user.id)
      .eq("person_id", pin.id)
      .eq("action_type", "OUTREACH")
      .eq("state", "NEW")
      .maybeSingle();

    if (!existingAction) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      
      const { error: actionError } = await supabase
        .from("actions")
        .insert({
          user_id: user.id,
          person_id: pin.id,
          action_type: "OUTREACH",
          state: "NEW",
          description: `Reach out to ${pin.name}`,
          due_date: today,
          auto_created: true,
        });

      if (actionError) {
        // Log error but don't fail the pin creation - action can be created later
        console.error("Error creating auto-action for new pin:", actionError);
        // Continue - pin was created successfully, action creation is secondary
      }
    }

    return NextResponse.json({ pin }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

