#!/usr/bin/env tsx
/**
 * Test script to manually trigger Day 0 payment failure email
 * 
 * Usage: tsx scripts/test-payment-failure-email.ts
 * 
 * Make sure to set environment variables:
 * - RESEND_API_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
const envPath = resolve(__dirname, "../web/.env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log("✅ Loaded environment variables from .env.local");
} catch (error) {
  console.warn("⚠️ Could not load .env.local, using environment variables");
  console.warn("   Make sure web/.env.local exists with required variables");
}

import { createAdminClient } from "../web/src/lib/supabase/admin";
import { sendPaymentFailureEmail } from "../web/src/lib/email/resend";

async function main() {
  const userEmail = "mcddsl+onboard2@gmail.com";
  const daysSinceFailure = 0;

  console.log(`Testing payment failure email for: ${userEmail}`);
  console.log(`Days since failure: ${daysSinceFailure}`);

  const supabase = createAdminClient();

  // Get user info
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", userEmail)
    .maybeSingle();

  if (userError || !user) {
    console.error("❌ User not found:", userError);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);

  try {
    console.log("📧 Sending payment failure email...");
    await sendPaymentFailureEmail({
      to: user.email,
      userName: user.name || "there",
      daysSinceFailure,
    });

    console.log("✅ Email sent successfully!");
    console.log(`\nCheck inbox for: ${user.email}`);
    console.log(`Expected subject: "Your payment failed — Update to keep your rhythm"`);
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

