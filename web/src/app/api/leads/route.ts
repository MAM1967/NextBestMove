import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MAX_PENDING_ACTIONS } from "@/lib/actions/limits";
import { checkLeadLimit } from "@/lib/billing/subscription";
import {
  getCadenceDaysDefault,
  validateCadenceDays,
} from "@/lib/leads/relationship-status";

// GET /api/leads - List all leads for the authenticated user
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
    const status = searchParams.get("status"); // Optional filter: ACTIVE, SNOOZED, ARCHIVED

    let query = supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, linkedin_url, email, phone_number, url, notes, cadence, cadence_days, tier, preferred_channel } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // At least one contact method should be provided
    const hasLinkedIn = linkedin_url?.trim();
    const hasEmail = email?.trim();
    const hasPhone = phone_number?.trim();
    const hasUrl = url?.trim();
    
    if (!hasLinkedIn && !hasEmail && !hasPhone && !hasUrl) {
      return NextResponse.json(
        { error: "Please provide at least one contact method (LinkedIn URL, email, or phone number)" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }
    }

    // Validate LinkedIn URL format if provided
    if (hasLinkedIn) {
      const trimmed = linkedin_url.trim();
      if (!trimmed.includes("linkedin.com") || (!trimmed.startsWith("https://") && !trimmed.startsWith("http://"))) {
        return NextResponse.json(
          { error: "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/...)" },
          { status: 400 }
        );
      }
    }

    // Validate phone number format if provided
    if (hasPhone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = phone_number.trim().replace(/\D/g, "");
      if (!phoneRegex.test(phone_number.trim()) || digitsOnly.length < 10) {
        return NextResponse.json(
          { error: "Please enter a valid phone number" },
          { status: 400 }
        );
      }
    }

    // Validate URL format if provided (for non-LinkedIn URLs)
    if (hasUrl && !url.startsWith("https://") && !url.startsWith("http://")) {
      return NextResponse.json(
        { error: "Please enter a valid URL (https://...)" },
        { status: 400 }
      );
    }

    // Check lead limit before creating
    const limitInfo = await checkLeadLimit(user.id);
    if (!limitInfo.canAdd) {
      return NextResponse.json(
        {
          error: "Lead limit reached",
          message: `You've reached your limit of ${
            limitInfo.limit
          } leads on the ${
            limitInfo.plan === "premium" ? "Premium" : "Standard"
          } plan. Upgrade to Premium for unlimited leads.`,
          limitInfo,
        },
        { status: 403 }
      );
    }

    // Compute cadence_days - use provided value or default for cadence
    let finalCadenceDays: number | null = null;
    if (cadence) {
      if (cadence_days !== undefined && cadence_days !== null) {
        // Validate provided cadence_days
        if (!validateCadenceDays(cadence, cadence_days)) {
          return NextResponse.json(
            { error: `Cadence days must be within the valid range for ${cadence}` },
            { status: 400 }
          );
        }
        finalCadenceDays = cadence_days;
      } else if (cadence !== "ad_hoc") {
        // Use default for cadence if not provided
        finalCadenceDays = getCadenceDaysDefault(cadence);
      }
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        name: name.trim(),
        linkedin_url: linkedin_url?.trim() || null,
        email: email?.trim() || null,
        phone_number: phone_number?.trim() || null,
        url: url?.trim() || null,
        notes: notes?.trim() || null,
        status: "ACTIVE",
        cadence: cadence || null,
        cadence_days: finalCadenceDays,
        tier: tier || null,
        preferred_channel: preferred_channel || null,
        // next_touch_due_at will be null initially (no last_interaction_at yet)
        // It will be computed when the first action is completed
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }

    // Automatically create an OUTREACH action for the new lead
    // This is core to the app's purpose: turn leads into revenue (actions)
    // Check action limit first (unless user is adding their first lead)
    const { isAtActionLimit } = await import("@/lib/actions/limits");
    const atLimit = await isAtActionLimit(user.id, false);

    if (atLimit) {
      // User is at action limit - log but don't fail lead creation
      console.log(
        `User ${user.id} is at action limit (${MAX_PENDING_ACTIONS}), skipping OUTREACH creation for new lead ${lead.id}`
      );
      // Continue - lead was created successfully, action can be created later when user completes some
    } else {
      // Check if there's already an OUTREACH action for this lead (shouldn't happen for new leads, but safety check)
      const { data: existingAction } = await supabase
        .from("actions")
        .select("id")
        .eq("user_id", user.id)
        .eq("person_id", lead.id)
        .eq("action_type", "OUTREACH")
        .eq("state", "NEW")
        .maybeSingle();

      if (!existingAction) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

        const { error: actionError } = await supabase.from("actions").insert({
          user_id: user.id,
          person_id: lead.id,
          action_type: "OUTREACH",
          state: "NEW",
          description: `Reach out to ${lead.name}`,
          due_date: today,
          notes: `Auto-created when lead added on ${new Date().toLocaleDateString()}`,
          auto_created: true,
        });

        if (actionError) {
          // Log error but don't fail the lead creation - action can be created later
          console.error("Error creating auto-action for new lead:", actionError);
          // Continue - lead was created successfully, action creation is secondary
        }
      }
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
