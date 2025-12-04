import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/users/onboarding-status
 * 
 * Returns the user's onboarding status and progress indicators.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with onboarding status
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Check if user has at least one pin (required for step 2)
    const { data: pins, error: pinsError } = await supabase
      .from("person_pins")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .limit(1);

    if (pinsError) {
      console.error("Error checking pins:", pinsError);
      // Don't fail - just assume no pins
    }

    return NextResponse.json({
      onboarding_completed: userProfile?.onboarding_completed || false,
      has_pin: (pins && pins.length > 0) || false,
    });
  } catch (error) {
    console.error("Unexpected error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

