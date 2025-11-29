"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const supabase = await createClient();

    // Check if we have a valid session (set by Supabase when user clicks reset link)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Invalid or expired reset link. Please request a new password reset link." };
    }

    // Update the password using Supabase's updateUser method
    // The session is already established by Supabase from the reset link
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      
      // Check if it's a session error (token expired or invalid)
      if (updateError.message.includes("session") || updateError.message.includes("token")) {
        return { error: "This reset link has expired or is invalid. Please request a new password reset link." };
      }
      
      return { error: updateError.message || "Failed to reset password. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in reset password:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

