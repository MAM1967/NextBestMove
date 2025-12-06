"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirect") as string | null;

  // Debug logging in staging
  const isStaging = process.env.VERCEL_ENV === "preview" || 
                     process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";
  
  // Trim whitespace
  const trimmedEmail = email?.trim() || "";
  const trimmedPassword = password?.trim() || "";
  
  if (isStaging) {
    console.log("[SignInAction] Debug:", {
      email: trimmedEmail ? `${trimmedEmail.substring(0, 3)}...${trimmedEmail.substring(trimmedEmail.length - 10)}` : "missing",
      emailLength: trimmedEmail.length,
      passwordLength: trimmedPassword.length,
      hasPassword: !!trimmedPassword,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseProjectId: process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "unknown",
    });
  }

  const supabase = await createClient();

  // Try to sign in
  const { error, data } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: trimmedPassword,
  });

  if (error) {
    if (isStaging) {
      console.error("[SignInAction] Sign-in error:", {
        message: error.message,
        status: error.status,
        email: trimmedEmail ? `${trimmedEmail.substring(0, 3)}...${trimmedEmail.substring(trimmedEmail.length - 10)}` : "missing",
        // Check if user exists in auth.users
        errorCode: error.message,
      });
      
      // Try to check if user exists (for debugging)
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(trimmedEmail);
        if (userError) {
          console.error("[SignInAction] User lookup error:", userError.message);
        } else {
          console.log("[SignInAction] User exists in auth.users:", {
            userId: userData.user?.id,
            emailConfirmed: !!userData.user?.email_confirmed_at,
            createdAt: userData.user?.created_at,
          });
        }
      } catch (adminError) {
        console.error("[SignInAction] Cannot check user (no admin access):", adminError);
      }
    }
    return { error: error.message };
  }

  if (isStaging) {
    console.log("[SignInAction] Sign-in successful:", {
      userId: data.user?.id,
      email: data.user?.email,
      sessionExists: !!data.session,
    });
  }

  return { success: true, redirectTo: redirectPath || "/app" };
}







