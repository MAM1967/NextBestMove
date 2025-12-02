import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { hasProfessionalFeature } from "@/lib/billing/subscription";

/**
 * GET /api/billing/check-premium-feature
 * 
 * Check if user has access to a premium feature
 * Query params:
 * - feature: pattern_detection | pre_call_briefs | content_engine | performance_timeline
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

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature");

    if (!feature) {
      return NextResponse.json(
        { error: "Feature parameter is required" },
        { status: 400 }
      );
    }

    // Validate feature name
    const validFeatures = [
      "pattern_detection",
      "pre_call_briefs",
      "content_engine",
      "performance_timeline",
    ];

    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: "Invalid feature name" },
        { status: 400 }
      );
    }

    const hasAccess = await hasProfessionalFeature(
      user.id,
      feature as "pattern_detection" | "pre_call_briefs" | "content_engine" | "performance_timeline"
    );

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Error checking premium feature access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

