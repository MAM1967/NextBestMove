import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/billing/subscription";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * POST /api/voice-profile/samples
 * 
 * Add a manual voice sample (email, LinkedIn post, etc.)
 * Premium feature only.
 */
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { sample_type, content } = body;

    if (!sample_type || !content) {
      return NextResponse.json(
        { error: "sample_type and content are required" },
        { status: 400 }
      );
    }

    if (!["email", "linkedin_post", "other"].includes(sample_type)) {
      return NextResponse.json(
        { error: "sample_type must be 'email', 'linkedin_post', or 'other'" },
        { status: 400 }
      );
    }

    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content must be at least 50 characters" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("manual_voice_samples")
      .insert({
        user_id: user.id,
        sample_type,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      logError("Failed to save manual voice sample", error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to save sample", details: error.message },
        { status: 500 }
      );
    }

    logInfo("Manual voice sample added", {
      userId: user.id,
      sampleType: sample_type,
    });

    return NextResponse.json({
      success: true,
      sample: data,
    });
  } catch (error) {
    logError("Failed to add manual voice sample", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice-profile/samples
 * 
 * Get all manual voice samples for the user
 */
export async function GET(request: Request) {
  try {
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

    const { data, error } = await supabase
      .from("manual_voice_samples")
      .select("id, sample_type, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch samples", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      samples: data || [],
    });
  } catch (error) {
    logError("Failed to fetch manual voice samples", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}


