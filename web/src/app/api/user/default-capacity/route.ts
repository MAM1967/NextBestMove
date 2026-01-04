import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CapacityLevel } from "@/lib/plan/capacity";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      default_capacity_override?: CapacityLevel | null;
    };

    // Validate capacity level if provided
    if (body.default_capacity_override !== null && body.default_capacity_override !== undefined) {
      const validLevels: CapacityLevel[] = [
        "micro",
        "light",
        "standard",
        "heavy",
        "default",
      ];
      if (!validLevels.includes(body.default_capacity_override)) {
        return NextResponse.json(
          { error: "Invalid capacity level" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("users")
      .update({
        default_capacity_override: body.default_capacity_override || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating default capacity:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update default capacity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating default capacity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

