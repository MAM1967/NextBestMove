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
  
  if (isStaging) {
    console.log("[SignInAction] Debug:", {
      email: email ? `${email.substring(0, 3)}...${email.substring(email.length - 10)}` : "missing",
      emailLength: email?.length || 0,
      passwordLength: password?.length || 0,
      hasPassword: !!password,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }

  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: email?.trim(), // Trim whitespace
    password: password?.trim(), // Trim whitespace
  });

  if (error) {
    if (isStaging) {
      console.error("[SignInAction] Sign-in error:", {
        message: error.message,
        status: error.status,
        email: email ? `${email.substring(0, 3)}...${email.substring(email.length - 10)}` : "missing",
      });
    }
    return { error: error.message };
  }

  if (isStaging) {
    console.log("[SignInAction] Sign-in successful:", {
      userId: data.user?.id,
      email: data.user?.email,
    });
  }

  return { success: true, redirectTo: redirectPath || "/app" };
}







