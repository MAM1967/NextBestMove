import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/billing/tier";

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(",") + "\n";
  }

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV rows
  const rows = [headers.map(escapeCSV).join(",")];
  
  for (const item of data) {
    const row = headers.map((header) => {
      // Handle nested properties (e.g., "leads.name")
      const value = header.split(".").reduce((obj, key) => obj?.[key], item);
      return escapeCSV(value);
    });
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Generate CSV export for Standard/Premium tiers
 */
function generateCSVExport(exportData: any): string {
  const csvSections: string[] = [];

  // Leads CSV
  if (exportData.data.pins && exportData.data.pins.length > 0) {
    csvSections.push("=== LEADS ===");
    csvSections.push(
      convertToCSV(exportData.data.pins, [
        "id",
        "name",
        "url",
        "notes",
        "status",
        "created_at",
        "updated_at",
      ])
    );
    csvSections.push("");
  }

  // Actions CSV
  if (exportData.data.actions && exportData.data.actions.length > 0) {
    csvSections.push("=== ACTIONS ===");
    csvSections.push(
      convertToCSV(exportData.data.actions, [
        "id",
        "action_type",
        "state",
        "description",
        "due_date",
        "completed_at",
        "notes",
        "created_at",
        "updated_at",
      ])
    );
    csvSections.push("");
  }

  // Daily Plans CSV (simplified - just plan metadata)
  if (exportData.data.daily_plans && exportData.data.daily_plans.length > 0) {
    csvSections.push("=== DAILY PLANS ===");
    const simplifiedPlans = exportData.data.daily_plans.map((plan: any) => ({
      id: plan.id,
      date: plan.date,
      capacity: plan.capacity,
      free_minutes: plan.free_minutes,
      created_at: plan.created_at,
    }));
    csvSections.push(
      convertToCSV(simplifiedPlans, [
        "id",
        "date",
        "capacity",
        "free_minutes",
        "created_at",
      ])
    );
    csvSections.push("");
  }

  // Weekly Summaries CSV
  if (
    exportData.data.weekly_summaries &&
    exportData.data.weekly_summaries.length > 0
  ) {
    csvSections.push("=== WEEKLY SUMMARIES ===");
    csvSections.push(
      convertToCSV(exportData.data.weekly_summaries, [
        "id",
        "week_start_date",
        "days_active",
        "actions_completed",
        "replies",
        "calls_booked",
        "created_at",
      ])
    );
  }

  return csvSections.join("\n");
}

/**
 * Export all user data
 * GET /api/export
 * 
 * Returns different formats based on tier:
 * - Free: JSON only
 * - Standard: CSV format
 * - Premium: ZIP file containing JSON, CSV, and metadata
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user tier to determine export format
  const tier = await getUserTier(supabase, user.id);

  try {
    // Fetch all user data in parallel
    const [
      { data: profile },
      { data: pins },
      { data: actions },
      { data: dailyPlans },
      { data: weeklySummaries },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_plans")
        .select(`
          *,
          daily_plan_actions (
            position,
            is_fast_win,
            actions (
              id,
              type,
              state,
              title,
              notes,
              due_date,
              snooze_until,
              created_at
            )
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("weekly_summaries")
        .select(`
          *,
          content_prompts (
            id,
            type,
            content,
            status,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("week_start_date", { ascending: false }),
    ]);

    // Format the export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      profile: profile || null,
      data: {
        pins: pins || [],
        actions: actions || [],
        daily_plans: dailyPlans || [],
        weekly_summaries: weeklySummaries || [],
      },
      summary: {
        total_pins: pins?.length || 0,
        total_actions: actions?.length || 0,
        total_daily_plans: dailyPlans?.length || 0,
        total_weekly_summaries: weeklySummaries?.length || 0,
      },
    };

    // Return format based on tier
    if (tier === "free") {
      // Free tier: JSON only
      return NextResponse.json(exportData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="nextbestmove-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    } else if (tier === "standard") {
      // Standard tier: CSV format
      const csvData = generateCSVExport(exportData);
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="nextbestmove-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // Premium tier: ZIP file with JSON, CSV, and metadata
      try {
        // Dynamic import for jszip (only for Premium tier)
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        // Add JSON file
        zip.file(
          "data.json",
          JSON.stringify(exportData, null, 2)
        );

        // Add CSV file
        const csvData = generateCSVExport(exportData);
        zip.file("data.csv", csvData);

        // Add metadata file
        const metadata = {
          export_date: exportData.export_date,
          export_version: "1.0",
          tier: "premium",
          user_id: user.id,
          user_email: user.email,
          summary: exportData.summary,
        };
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        return new NextResponse(zipBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="nextbestmove-export-${new Date().toISOString().split("T")[0]}.zip"`,
          },
        });
      } catch (error) {
        console.error("Error creating ZIP export:", error);
        // Fallback to JSON if ZIP creation fails
        return NextResponse.json(exportData, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="nextbestmove-export-${new Date().toISOString().split("T")[0]}.json"`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}






