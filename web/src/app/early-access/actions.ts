"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEarlyAccessConfirmationEmail } from "@/lib/email/early-access";

export async function submitEarlyAccessForm(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const linkedinUrl = formData.get("linkedin_url") as string | null;
  const role = formData.get("role") as string;
  const activeClientsCount = formData.get("active_clients_count") as string;

  // Validate required fields
  if (!name || !email || !role || !activeClientsCount) {
    return { error: "Please fill in all required fields." };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Validate role
  const validRoles = ["fractional_cmo", "agency", "consultant", "other"];
  if (!validRoles.includes(role)) {
    return { error: "Please select a valid role." };
  }

  // Validate active clients count
  const clientsCount = parseInt(activeClientsCount, 10);
  if (isNaN(clientsCount) || clientsCount < 1) {
    return { error: "Please enter a valid number of active clients (at least 1)." };
  }

  // Validate LinkedIn URL if provided
  if (linkedinUrl && linkedinUrl.trim() !== "") {
    try {
      const url = new URL(linkedinUrl);
      if (!url.hostname.includes("linkedin.com")) {
        return { error: "Please enter a valid LinkedIn URL." };
      }
    } catch {
      return { error: "Please enter a valid LinkedIn URL." };
    }
  }

  const supabase = await createClient();

  // Check for duplicate email
  const { data: existingSignup, error: checkError } = await supabase
    .from("early_access_signups")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 is "not found" which is fine - means no duplicate
    console.error("[EarlyAccess] Error checking for duplicate:", checkError);
    return { error: "An error occurred. Please try again." };
  }

  if (existingSignup) {
    return {
      error: "This email is already registered for early access. We'll be in touch soon!",
    };
  }

  // Insert signup
  const { error: insertError } = await supabase.from("early_access_signups").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    linkedin_url: linkedinUrl?.trim() || null,
    role: role,
    active_clients_count: clientsCount,
    status: "pending",
  });

  if (insertError) {
    console.error("[EarlyAccess] Error inserting signup:", insertError);
    // Check if it's a duplicate constraint violation
    if (insertError.code === "23505" || insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
      return {
        error: "This email is already registered for early access. We'll be in touch soon!",
      };
    }
    return { error: "We're sorry, something went wrong. Please try again in a moment." };
  }

  // Send confirmation email
  try {
    await sendEarlyAccessConfirmationEmail({
      to: email.trim(),
      name: name.trim(),
    });
  } catch (emailError) {
    // Log error but don't fail the form submission
    console.error("[EarlyAccess] Error sending confirmation email:", emailError);
    // Continue - signup was successful even if email fails
  }

  return { success: true };
}

