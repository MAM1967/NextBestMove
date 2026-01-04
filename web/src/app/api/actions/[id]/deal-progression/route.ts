import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { DealStage } from "@/lib/analytics/deal-progression";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: actionId } = await params;
    const body = (await request.json()) as {
      deal_stage?: DealStage | null;
      deal_value?: number | null;
    };

    // Validate deal_stage if provided
    if (body.deal_stage !== null && body.deal_stage !== undefined) {
      const validStages: DealStage[] = [
        "prospecting",
        "qualifying",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ];
      if (!validStages.includes(body.deal_stage)) {
        return NextResponse.json(
          { error: "Invalid deal stage" },
          { status: 400 }
        );
      }
    }

    // Validate deal_value if provided
    if (body.deal_value !== null && body.deal_value !== undefined) {
      if (typeof body.deal_value !== "number" || body.deal_value < 0) {
        return NextResponse.json(
          { error: "Deal value must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Verify action belongs to user
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .select("id")
      .eq("id", actionId)
      .eq("user_id", user.id)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Update action
    const updateData: {
      deal_stage?: DealStage | null;
      deal_value?: number | null;
    } = {};

    if (body.deal_stage !== undefined) {
      updateData.deal_stage = body.deal_stage;
    }
    if (body.deal_value !== undefined) {
      updateData.deal_value = body.deal_value;
    }

    const { data: updatedAction, error: updateError } = await supabase
      .from("actions")
      .update(updateData)
      .eq("id", actionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating deal progression:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update deal progression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ action: updatedAction });
  } catch (error) {
    console.error("Error updating deal progression:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

