import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionInfo } from "@/lib/billing/subscription";
import {
  collectUserTextSamples,
  countUserTextSamples,
  analyzeVoiceStyle,
  type VoiceCharacteristics,
} from "@/lib/ai/voice-analysis";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * POST /api/voice-profile/analyze
 * 
 * Analyze user's writing style and create/update voice profile.
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

    // Get user AI preferences for BYOK
    const { data: userProfile } = await supabase
      .from("users")
      .select("ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", user.id)
      .single();

    // Collect text samples
    const samples = await collectUserTextSamples(supabase, user.id, 5);

    if (samples.length < 5) {
      return NextResponse.json(
        {
          error: "Insufficient samples",
          message: `Need at least 5 text samples. Found ${samples.length}. Edit more content prompts, add notes to actions/pins, or add sample emails/LinkedIn posts below.`,
          sampleCount: samples.length,
        },
        { status: 400 }
      );
    }

    logInfo("Analyzing voice profile", {
      userId: user.id,
      sampleCount: samples.length,
    });

    // Analyze voice style
    const characteristics = await analyzeVoiceStyle(
      samples,
      userProfile?.ai_provider,
      userProfile?.ai_api_key_encrypted,
      userProfile?.ai_model
    );

    if (!characteristics) {
      return NextResponse.json(
        { error: "Failed to analyze voice style" },
        { status: 500 }
      );
    }

    // Store or update voice profile
    const adminSupabase = createAdminClient();
    const { error: upsertError } = await adminSupabase
      .from("user_voice_profile")
      .upsert(
        {
          user_id: user.id,
          voice_characteristics: characteristics as any, // JSONB
          sample_count: samples.length,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      logError("Failed to save voice profile", upsertError, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to save voice profile", details: upsertError.message },
        { status: 500 }
      );
    }

    logInfo("Voice profile created/updated", {
      userId: user.id,
      sampleCount: samples.length,
    });

    return NextResponse.json({
      success: true,
      characteristics,
      sampleCount: samples.length,
    });
  } catch (error) {
    logError("Failed to analyze voice profile", error);
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
 * GET /api/voice-profile/analyze
 * 
 * Get current voice profile status
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

    // Get voice profile
    const { data: profile, error } = await supabase
      .from("user_voice_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is OK
      return NextResponse.json(
        { error: "Failed to fetch voice profile", details: error.message },
        { status: 500 }
      );
    }

    // Check available samples (fast count only, no need to fetch full text)
    const sampleCount = await countUserTextSamples(supabase, user.id);

    return NextResponse.json({
      hasProfile: !!profile,
      profile: profile
        ? {
            characteristics: profile.voice_characteristics,
            sampleCount: profile.sample_count,
            lastUpdated: profile.last_updated,
          }
        : null,
      availableSamples: sampleCount,
      canAnalyze: sampleCount >= 5,
    });
  } catch (error) {
    logError("Failed to fetch voice profile", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

