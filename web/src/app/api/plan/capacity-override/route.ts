import { createClient } from "@/lib/supabase/server";
import {
  setCapacityOverride,
  removeCapacityOverride,
  type CapacityLevel,
} from "@/lib/plan/capacity";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      date: string;
      capacity: CapacityLevel;
      reason?: string;
    };

    if (!body.date || !body.capacity) {
      return NextResponse.json(
        { error: "date and capacity are required" },
        { status: 400 }
      );
    }

    // Validate capacity level
    const validLevels: CapacityLevel[] = [
      "micro",
      "light",
      "standard",
      "heavy",
      "default",
    ];
    if (!validLevels.includes(body.capacity)) {
      return NextResponse.json(
        { error: "Invalid capacity level" },
        { status: 400 }
      );
    }

    const result = await setCapacityOverride(
      supabase,
      user.id,
      body.date,
      body.capacity,
      body.reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to set capacity override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting capacity override:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    const result = await removeCapacityOverride(supabase, user.id, date);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to remove capacity override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing capacity override:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

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
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    // Get override for specific date
    const { data: plan } = await supabase
      .from("daily_plans")
      .select("capacity_override, override_reason")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    // Get user default override
    const { data: userProfile } = await supabase
      .from("users")
      .select("default_capacity_override")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      dailyOverride: plan?.capacity_override || null,
      dailyOverrideReason: plan?.override_reason || null,
      defaultOverride: userProfile?.default_capacity_override || null,
    });
  } catch (error) {
    console.error("Error getting capacity override:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

