import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectUserPatterns } from "@/lib/patterns/detection";
import { attachInsightsToPatterns } from "@/lib/patterns/insights";
import { hasProfessionalFeature } from "@/lib/billing/subscription";
import { logError } from "@/lib/utils/logger";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProfessionalFeature(
      user.id,
      "pattern_detection"
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Upgrade required", code: "UPGRADE_REQUIRED" },
        { status: 402 }
      );
    }

    const adminSupabase = createAdminClient();

    // Detect raw patterns for the user
    const patterns = await detectUserPatterns(adminSupabase, user.id);

    if (patterns.length === 0) {
      return NextResponse.json({
        success: true,
        patterns: [],
        message:
          "Not enough activity yet to detect meaningful patterns. Keep completing actions and check back soon.",
      });
    }

    // For now we don't have per-user AI settings wired here; pass system defaults
    const patternsWithInsights = await attachInsightsToPatterns(patterns, {});

    return NextResponse.json({
      success: true,
      patterns: patternsWithInsights,
    });
  } catch (error) {
    logError("Failed to fetch pattern detection insights", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}


