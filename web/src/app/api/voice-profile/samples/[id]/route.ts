import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/billing/subscription";
import { logError } from "@/lib/utils/logger";

/**
 * DELETE /api/voice-profile/samples/[id]
 * 
 * Delete a manual voice sample
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Premium gating
    const subscription = await getSubscriptionInfo(user.id);
    if (
      subscription.plan !== "premium" ||
      (subscription.status !== "active" && subscription.status !== "trialing")
    ) {
      return NextResponse.json(
        { error: "Upgrade required", code: "UPGRADE_REQUIRED" },
        { status: 402 }
      );
    }

    const { error } = await supabase
      .from("manual_voice_samples")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logError("Failed to delete manual voice sample", error, {
        userId: user.id,
        sampleId: id,
      });
      return NextResponse.json(
        { error: "Failed to delete sample", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Failed to delete manual voice sample", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

