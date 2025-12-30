import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { hashEmailAddress } from "@/lib/email/utils";

/**
 * GET /api/email/debug?relationshipId=<uuid>
 * 
 * Debug endpoint to check email matching for a specific relationship.
 * Shows:
 * - Relationship email data
 * - Email hash
 * - Unmatched emails with their hashes
 * - Matched emails
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
    const relationshipId = searchParams.get("relationshipId");

    if (!relationshipId) {
      return NextResponse.json(
        { error: "relationshipId query parameter is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Get the relationship
    const { data: relationship, error: relError } = await adminSupabase
      .from("leads")
      .select("id, name, email, url, linkedin_url, phone_number")
      .eq("id", relationshipId)
      .eq("user_id", user.id)
      .single();

    if (relError || !relationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    // Calculate email hashes
    const emailHashes: Array<{ source: string; email: string; hash: string }> = [];
    
    if (relationship.email) {
      const hash = hashEmailAddress(relationship.email);
      emailHashes.push({
        source: "email field",
        email: relationship.email,
        hash,
      });
    }

    if (relationship.url?.startsWith("mailto:")) {
      const email = relationship.url.substring(7);
      const hash = hashEmailAddress(email);
      emailHashes.push({
        source: "url field (mailto:)",
        email,
        hash,
      });
    }

    // Get matched emails
    const matchedEmails = emailHashes.length > 0
      ? await adminSupabase
          .from("email_metadata")
          .select("id, subject, snippet, received_at, from_email_hash")
          .eq("user_id", user.id)
          .in(
            "from_email_hash",
            emailHashes.map((h) => h.hash)
          )
          .order("received_at", { ascending: false })
          .limit(10)
      : { data: [], error: null };

    // Get unmatched emails (for comparison)
    const { data: unmatchedEmails } = await adminSupabase
      .from("email_metadata")
      .select("id, subject, snippet, received_at, from_email_hash")
      .eq("user_id", user.id)
      .is("person_id", null)
      .order("received_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      relationship: {
        id: relationship.id,
        name: relationship.name,
        email: relationship.email,
        url: relationship.url,
        linkedin_url: relationship.linkedin_url,
        phone_number: relationship.phone_number,
      },
      emailHashes,
      matchedEmails: matchedEmails.data || [],
      unmatchedEmailsSample: unmatchedEmails || [],
      message: `Found ${emailHashes.length} email hash(es) for this relationship. ${matchedEmails.data?.length || 0} matched email(s) found.`,
    });
  } catch (error) {
    console.error("Email debug error:", error);
    return NextResponse.json(
      {
        error: "Failed to debug email matching",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

