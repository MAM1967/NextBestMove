import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NotificationType } from "@/lib/notifications/channels";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefError && prefError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is okay (will use defaults)
      console.error("Error fetching notification preferences:", prefError);
      return NextResponse.json(
        { error: prefError.message },
        { status: 500 }
      );
    }

    // If no preferences exist, create with defaults
    if (!preferences) {
      // Fallback to users table for backward compatibility
      const { data: userPrefs } = await supabase
        .from("users")
        .select(
          "email_morning_plan, email_fast_win_reminder, email_follow_up_alerts, email_weekly_summary"
        )
        .eq("id", user.id)
        .single();

      if (userPrefs) {
        // Create preferences from user table
        const { data: newPrefs, error: createError } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            morning_plan_email: userPrefs.email_morning_plan ?? true,
            fast_win_reminder_email: userPrefs.email_fast_win_reminder ?? true,
            follow_up_alerts_email: userPrefs.email_follow_up_alerts ?? true,
            weekly_summary_email: userPrefs.email_weekly_summary ?? true,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating notification preferences:", createError);
        }

        return NextResponse.json(newPrefs || {
          morning_plan_email: userPrefs.email_morning_plan ?? true,
          fast_win_reminder_email: userPrefs.email_fast_win_reminder ?? true,
          follow_up_alerts_email: userPrefs.email_follow_up_alerts ?? true,
          weekly_summary_email: userPrefs.email_weekly_summary ?? true,
          morning_plan_push: false,
          fast_win_reminder_push: false,
          follow_up_alerts_push: false,
          weekly_summary_push: false,
        });
      }

      // Return defaults if no user prefs exist
      return NextResponse.json({
        morning_plan_email: true,
        fast_win_reminder_email: true,
        follow_up_alerts_email: true,
        weekly_summary_email: true,
        morning_plan_push: false,
        fast_win_reminder_push: false,
        follow_up_alerts_push: false,
        weekly_summary_push: false,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

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
      morning_plan_email?: boolean;
      morning_plan_push?: boolean;
      fast_win_reminder_email?: boolean;
      fast_win_reminder_push?: boolean;
      follow_up_alerts_email?: boolean;
      follow_up_alerts_push?: boolean;
      weekly_summary_email?: boolean;
      weekly_summary_push?: boolean;
    };

    // Upsert preferences
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          morning_plan_email: body.morning_plan_email ?? true,
          morning_plan_push: body.morning_plan_push ?? false,
          fast_win_reminder_email: body.fast_win_reminder_email ?? true,
          fast_win_reminder_push: body.fast_win_reminder_push ?? false,
          follow_up_alerts_email: body.follow_up_alerts_email ?? true,
          follow_up_alerts_push: body.follow_up_alerts_push ?? false,
          weekly_summary_email: body.weekly_summary_email ?? true,
          weekly_summary_push: body.weekly_summary_push ?? false,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating notification preferences:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

