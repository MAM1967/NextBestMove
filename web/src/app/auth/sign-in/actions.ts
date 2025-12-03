"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirect") as string | null;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, redirectTo: redirectPath || "/app" };
}






