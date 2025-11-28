import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey, isValidOpenAIKey } from "@/lib/encryption";

/**
 * PATCH /api/ai/preferences
 * Update user's AI preferences (BYOK)
 * Premium users only
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has premium subscription
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!billingCustomer) {
    return NextResponse.json(
      { error: "Premium subscription required" },
      { status: 403 }
    );
  }

  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("metadata")
    .eq("billing_customer_id", billingCustomer.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  const planType = (subscription?.metadata as any)?.plan_type;
  if (planType !== "premium") {
    return NextResponse.json(
      { error: "Premium subscription required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { ai_provider, ai_api_key, ai_model } = body;

  // Validate provider
  if (ai_provider && !["system", "openai"].includes(ai_provider)) {
    return NextResponse.json(
      { error: "Invalid AI provider" },
      { status: 400 }
    );
  }

  // Validate API key if provided
  if (ai_api_key && !isValidOpenAIKey(ai_api_key)) {
    return NextResponse.json(
      { error: "Invalid OpenAI API key format" },
      { status: 400 }
    );
  }

  // Prepare update
  const updateData: any = {};
  if (ai_provider) {
    updateData.ai_provider = ai_provider;
  }
  if (ai_api_key !== undefined) {
    if (ai_api_key === null) {
      // Removing API key
      updateData.ai_api_key_encrypted = null;
      updateData.ai_provider = "system";
      updateData.ai_model = null;
    } else {
      // Encrypt and save
      updateData.ai_api_key_encrypted = encryptApiKey(ai_api_key);
      updateData.ai_provider = "openai";
    }
  }
  if (ai_model) {
    updateData.ai_model = ai_model;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("Error updating AI preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

