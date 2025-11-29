"use server";

import { createClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(
  prevState: { error?: string; success?: boolean; message?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const supabase = await createClient();

    // Determine the base URL for the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Password reset error:", error);
      // Don't reveal if email exists or not (security best practice)
      // Always return success message
      return {
        success: true,
        message: "If an account exists with this email, you'll receive a password reset link shortly.",
      };
    }

    return {
      success: true,
      message: "If an account exists with this email, you'll receive a password reset link shortly.",
    };
  } catch (error) {
    console.error("Unexpected error in forgot password:", error);
    // Still return success to avoid email enumeration
    return {
      success: true,
      message: "If an account exists with this email, you'll receive a password reset link shortly.",
    };
  }
}

