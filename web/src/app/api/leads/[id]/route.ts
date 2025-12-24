import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  computeNextTouchDueAt,
  getCadenceDaysDefault,
  validateCadenceDays,
} from "@/lib/leads/relationship-status";

// GET /api/leads/[id] - Get a specific lead
export async function GET(
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

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      console.error("Error fetching lead:", error);
      return NextResponse.json(
        { error: "Failed to fetch lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(
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

    const body = await request.json();
    const { name, url, notes, cadence, cadence_days, tier, preferred_channel } = body;

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Normalize URL - auto-add mailto: for email addresses
    let normalizedUrl = url.trim();
    if (
      normalizedUrl.includes("@") &&
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://") &&
      !normalizedUrl.startsWith("mailto:")
    ) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(normalizedUrl)) {
        normalizedUrl = `mailto:${normalizedUrl}`;
      }
    }

    // Validate URL format
    if (
      !normalizedUrl.startsWith("https://") &&
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("mailto:")
    ) {
      return NextResponse.json(
        { error: "Please enter a valid URL (https://...) or email address" },
        { status: 400 }
      );
    }

    // Get current lead to check if cadence changed
    const { data: currentLead } = await supabase
      .from("leads")
      .select("cadence, cadence_days, last_interaction_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    // Build update object
    const updateData: {
      name: string;
      url: string;
      notes: string | null;
      cadence?: string | null;
      cadence_days?: number | null;
      tier?: string | null;
      preferred_channel?: string | null;
      next_touch_due_at?: string | null;
    } = {
      name: name.trim(),
      url: normalizedUrl,
      notes: notes?.trim() || null,
    };

    // Add cadence, tier, and preferred_channel if provided
    const newCadence = cadence !== undefined ? (cadence || null) : currentLead?.cadence;
    if (cadence !== undefined) {
      updateData.cadence = cadence || null;
    }
    if (tier !== undefined) {
      updateData.tier = tier || null;
    }
    if (preferred_channel !== undefined) {
      updateData.preferred_channel = preferred_channel || null;
    }

    // Handle cadence_days and next_touch_due_at computation
    if (cadence !== undefined || cadence_days !== undefined || newCadence) {
      let finalCadenceDays: number | null = null;
      
      // Use provided cadence_days if specified, otherwise use default for cadence
      if (cadence_days !== undefined) {
        finalCadenceDays = cadence_days || null;
      } else if (newCadence && newCadence !== "ad_hoc") {
        // Use existing cadence_days if cadence hasn't changed, otherwise use default
        if (newCadence === currentLead?.cadence && currentLead?.cadence_days) {
          finalCadenceDays = currentLead.cadence_days;
        } else {
          finalCadenceDays = getCadenceDaysDefault(newCadence as any);
        }
      } else if (newCadence === "ad_hoc") {
        finalCadenceDays = null;
      }
      
      // Validate cadence_days if cadence is set
      if (newCadence && newCadence !== "ad_hoc" && finalCadenceDays !== null) {
        if (!validateCadenceDays(newCadence as any, finalCadenceDays)) {
          return NextResponse.json(
            { error: `Cadence days must be within the valid range for ${newCadence}` },
            { status: 400 }
          );
        }
      }
      
      updateData.cadence_days = finalCadenceDays;

      // Compute next_touch_due_at from last_interaction_at and cadence_days
      const lastInteractionAt = currentLead?.last_interaction_at || null;
      if (newCadence && newCadence !== "ad_hoc" && lastInteractionAt && finalCadenceDays) {
        const nextTouchDueAt = computeNextTouchDueAt(
          lastInteractionAt,
          finalCadenceDays
        );
        updateData.next_touch_due_at = nextTouchDueAt;
      } else if (newCadence === "ad_hoc" || !newCadence) {
        // Ad-hoc or no cadence means no next touch due
        updateData.next_touch_due_at = null;
      }
      // If no last_interaction_at, next_touch_due_at stays null (will be computed when interaction happens)
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      console.error("Error updating lead:", error);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a lead
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

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting lead:", error);
      return NextResponse.json(
        { error: "Failed to delete lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

