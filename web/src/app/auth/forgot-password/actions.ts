"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email/resend";

export async function forgotPasswordAction(
  prevState: { error?: string; success?: boolean; message?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const adminClient = createAdminClient();

    // Determine the base URL for the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.NODE_ENV === "production" ? "https://nextbestmove.app" : "http://localhost:3000");
    const redirectTo = `${baseUrl}/auth/reset-password`;

    console.log("🔐 Password reset request:", {
      email: email.substring(0, 3) + "***",
      redirectTo,
      baseUrl,
      nodeEnv: process.env.NODE_ENV,
    });

    // Use Admin API to generate password reset link
    // This generates a secure token and link without sending email
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("❌ Password reset link generation error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      // Don't reveal if email exists or not (security best practice)
      // Always return success message
      return {
        success: true,
        message: "If an account exists with this email, you'll receive a password reset link shortly.",
      };
    }

    if (!data?.properties?.action_link) {
      console.error("❌ No reset link generated");
      return {
        success: true,
        message: "If an account exists with this email, you'll receive a password reset link shortly.",
      };
    }

    // Get user info for personalized email
    const resetLink = data.properties.action_link;
    const userName = data.user?.user_metadata?.name || data.user?.email?.split("@")[0] || "there";

    // Send email via Resend
    try {
      const emailResult = await sendPasswordResetEmail({
        to: email,
        userName,
        resetLink,
      });

      console.log("✅ Password reset email sent via Resend:", {
        email: email.substring(0, 3) + "***",
        emailId: emailResult?.id,
        resetLink: resetLink.substring(0, 50) + "...",
      });
    } catch (emailError) {
      console.error("❌ Failed to send password reset email via Resend:", {
        error: emailError instanceof Error ? emailError.message : String(emailError),
        email: email.substring(0, 3) + "***",
        stack: emailError instanceof Error ? emailError.stack : undefined,
      });
      // Still return success to avoid email enumeration, but log the error for debugging
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

