"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitFeedback(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to submit feedback." };
  }

  const reason = formData.get("reason") as string;
  const additionalFeedback = formData.get("additional_feedback") as string | null;

  if (!reason) {
    return { error: "Please select a reason for cancellation." };
  }

  const { error } = await supabase.from("cancellation_feedback").insert({
    user_id: user.id,
    reason,
    additional_feedback: additionalFeedback || null,
  });

  if (error) {
    console.error("Error submitting feedback:", error);
    return { error: "Failed to submit feedback. Please try again." };
  }

  revalidatePath("/app/feedback");
  return { success: true };
}

