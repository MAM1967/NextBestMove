import { createClient } from "@/lib/supabase/server";
import { registerPushToken } from "@/lib/notifications/push";
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
      token: string;
      platform: "web" | "ios" | "android";
      deviceId?: string;
    };

    if (!body.token || !body.platform) {
      return NextResponse.json(
        { error: "token and platform are required" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["web", "ios", "android"];
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be web, ios, or android" },
        { status: 400 }
      );
    }

    const result = await registerPushToken(
      supabase,
      user.id,
      body.token,
      body.platform,
      body.deviceId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to register push token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

