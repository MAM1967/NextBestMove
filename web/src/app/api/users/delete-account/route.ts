import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/users/delete-account
 * Delete user account and all associated data
 * 
 * Compliance requirements:
 * - Delete all user data (GDPR right to erasure)
 * - Delete from Supabase Auth
 * - Delete from all related tables
 * - Log deletion for audit purposes
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Delete all user data in order (respecting foreign key constraints)
    // Check for errors at each step
    // 1. Content prompts (references weekly_summaries)
    const { data: contentPromptsData, error: contentPromptsError } = await supabase
      .from("content_prompts")
      .delete()
      .eq("user_id", userId)
      .select();
    if (contentPromptsError) {
      console.error("Error deleting content prompts:", contentPromptsError);
      throw contentPromptsError;
    }
    console.log(`Deleted ${contentPromptsData?.length || 0} content prompts`);

    // 2. Weekly summaries
    const { error: weeklySummariesError } = await supabase
      .from("weekly_summaries")
      .delete()
      .eq("user_id", userId);
    if (weeklySummariesError) {
      console.error("Error deleting weekly summaries:", weeklySummariesError);
      throw weeklySummariesError;
    }

    // 3. Daily plan actions (junction table)
    // First get all daily plan IDs for this user
    const { data: dailyPlans, error: dailyPlansSelectError } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", userId);
    if (dailyPlansSelectError) {
      console.error("Error selecting daily plans:", dailyPlansSelectError);
      throw dailyPlansSelectError;
    }

    if (dailyPlans && dailyPlans.length > 0) {
      const planIds = dailyPlans.map((p) => p.id);
      const { error: dailyPlanActionsError } = await supabase
        .from("daily_plan_actions")
        .delete()
        .in("daily_plan_id", planIds);
      if (dailyPlanActionsError) {
        console.error("Error deleting daily plan actions:", dailyPlanActionsError);
        throw dailyPlanActionsError;
      }
    }

    // 4. Daily plans
    const { error: dailyPlansError } = await supabase
      .from("daily_plans")
      .delete()
      .eq("user_id", userId);
    if (dailyPlansError) {
      console.error("Error deleting daily plans:", dailyPlansError);
      throw dailyPlansError;
    }

    // 5. Actions
    const { error: actionsError } = await supabase
      .from("actions")
      .delete()
      .eq("user_id", userId);
    if (actionsError) {
      console.error("Error deleting actions:", actionsError);
      throw actionsError;
    }

    // 6. Person pins
    const { error: pinsError } = await supabase
      .from("person_pins")
      .delete()
      .eq("user_id", userId);
    if (pinsError) {
      console.error("Error deleting person pins:", pinsError);
      throw pinsError;
    }

    // 7. Calendar connections
    const { error: calendarError } = await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", userId);
    if (calendarError) {
      console.error("Error deleting calendar connections:", calendarError);
      throw calendarError;
    }

    // 8. Billing subscriptions (cascade should handle this, but explicit for safety)
    const { data: billingCustomer, error: billingCustomerError } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (billingCustomerError && billingCustomerError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error selecting billing customer:", billingCustomerError);
      throw billingCustomerError;
    }

    if (billingCustomer) {
      const { error: subscriptionsError } = await supabase
        .from("billing_subscriptions")
        .delete()
        .eq("billing_customer_id", billingCustomer.id);
      if (subscriptionsError) {
        console.error("Error deleting billing subscriptions:", subscriptionsError);
        throw subscriptionsError;
      }

      const { error: customersError } = await supabase
        .from("billing_customers")
        .delete()
        .eq("user_id", userId);
      if (customersError) {
        console.error("Error deleting billing customer:", customersError);
        throw customersError;
      }
    }

    // 9. User profile (last, as other tables may reference it)
    const { data: userDeleteData, error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)
      .select();
    if (userDeleteError) {
      console.error("Error deleting user profile:", userDeleteError);
      console.error("User ID:", userId);
      throw userDeleteError;
    }
    if (!userDeleteData || userDeleteData.length === 0) {
      console.error("User deletion returned no rows - user may not exist or RLS blocked deletion");
      throw new Error("User deletion failed - no rows deleted. Check RLS policies.");
    }
    console.log(`Deleted user profile: ${userDeleteData[0]?.email || userId}`);

    // 10. Delete from Supabase Auth
    // Supabase Auth stores users in auth.users (not directly accessible)
    // We need to use the Admin API to delete the auth user
    // This prevents the user from signing back in
    // Get service role key - check both possible env var names
    // In Next.js API routes, process.env works directly (no need for next.config.ts)
    const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    // Trim whitespace that might have been accidentally added
    const serviceRoleKey = rawServiceRoleKey?.trim();
    
    console.log("=== Service Role Key Debug ===");
    console.log("Service role key present:", !!serviceRoleKey);
    console.log("Service role key length:", serviceRoleKey?.length || 0);
    console.log("Service role key starts with:", serviceRoleKey?.substring(0, 20) || "N/A");
    console.log("Service role key ends with:", serviceRoleKey?.substring(serviceRoleKey?.length - 10) || "N/A");
    console.log("All env vars with SUPABASE:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
    
    // Service role keys are typically 300+ characters long
    // If it's shorter, it might be truncated or incorrect
    if (serviceRoleKey && serviceRoleKey.length < 250) {
      console.warn("⚠️ WARNING: Service role key is shorter than expected!");
      console.warn("   Typical service role keys are 300+ characters long");
      console.warn("   Current length:", serviceRoleKey.length);
      console.warn("   This key might be truncated or incorrect");
    }
    
    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in process.env");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes("SERVICE") || k.includes("SUPABASE")));
      return NextResponse.json(
        { 
          error: "Service role key not configured",
          details: "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Please add it to Vercel environment variables.",
          hint: "Go to Vercel Dashboard → Project Settings → Environment Variables → Add SUPABASE_SERVICE_ROLE_KEY"
        },
        { status: 500 }
      );
    }
    
    // Use admin client helper - it will validate the key format and throw if invalid
    try {
      console.log("Creating admin client...");
      console.log("Service role key present:", !!serviceRoleKey);
      console.log("Service role key length:", serviceRoleKey?.length || 0);
      console.log("Service role key starts with:", serviceRoleKey?.substring(0, 20) || "N/A");
      
      // The createAdminClient helper will validate the key format
      // It will throw an error if the key is invalid or missing
      const adminClient = createAdminClient();
      
      console.log("✅ Admin client created successfully");
      console.log("Attempting to delete auth user:", userId);
      
      // Verify the admin client can access auth
      // Test by trying to list users (this will fail if key is invalid)
      console.log("=== Testing admin client access ===");
      try {
        const { data: testData, error: testError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });
        
        if (testError) {
          console.error("❌ Admin client test failed:", testError);
          console.error("Test error status:", testError.status);
          console.error("Test error message:", testError.message);
          console.error("Test error name:", testError.name);
          console.error("Full test error:", JSON.stringify(testError, null, 2));
          console.error("This suggests the service role key is invalid for this Supabase project");
          console.error("Supabase URL used:", supabaseUrl);
          console.error("Service key first 50 chars:", serviceRoleKey.substring(0, 50));
          
          return NextResponse.json(
            { 
              error: "Invalid service role key",
              details: testError.message || "The service role key does not match this Supabase project",
              hint: `Verify that SUPABASE_SERVICE_ROLE_KEY in Vercel matches the service_role key in Supabase Dashboard → Settings → API for project: ${supabaseUrl}. The key should start with 'eyJ' and be a long JWT token.`
            },
            { status: 500 }
          );
        }
        
        console.log("✅ Admin client test passed - key is valid");
        console.log("Test returned user count:", testData?.users?.length || 0);
      } catch (testException) {
        console.error("❌ Exception during admin client test:", testException);
        console.error("Exception type:", testException instanceof Error ? testException.constructor.name : typeof testException);
        console.error("Exception message:", testException instanceof Error ? testException.message : String(testException));
        return NextResponse.json(
          { 
            error: "Failed to validate service role key",
            details: testException instanceof Error ? testException.message : String(testException),
            hint: "There was an exception while testing the admin client. Check Vercel function logs for details. Make sure SUPABASE_SERVICE_ROLE_KEY in Vercel matches the service_role key from Supabase Dashboard."
          },
          { status: 500 }
        );
      }
      
      // Use the admin API to delete the auth user
      // This is the correct method per Supabase docs
      // Note: deleteUser second parameter is boolean for shouldSoftDelete
      const { data: deleteData, error: authDeleteError } = await adminClient.auth.admin.deleteUser(
        userId,
        false // Hard delete, not soft delete
      );

      if (authDeleteError) {
        console.error("❌ Error deleting auth user:", authDeleteError);
        console.error("Error code:", authDeleteError.status);
        console.error("Error message:", authDeleteError.message);
        console.error("Error name:", authDeleteError.name);
        console.error("Full error:", JSON.stringify(authDeleteError, null, 2));
        
          // Check if it's an API key error
          if (authDeleteError.message?.includes("Invalid API key") || authDeleteError.message?.includes("JWT") || authDeleteError.message?.includes("invalid")) {
            console.error("⚠️ This appears to be an API key validation error");
            console.error("   Environment:", process.env.NODE_ENV || "development");
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
            if (supabaseUrl) {
              console.error("   Supabase URL:", supabaseUrl);
            }
            console.error("   Service key present:", !!serviceRoleKey);
            console.error("   Service key length:", serviceRoleKey?.length || 0);
            if (serviceRoleKey) {
              console.error("   Service key starts with eyJ:", serviceRoleKey.startsWith("eyJ"));
            }
          console.error("   Verify the service role key in .env.local (local) or Vercel (production)");
          console.error("   Key should start with 'eyJ' and be the full JWT token from Supabase Dashboard");
          
          return NextResponse.json(
            { 
              error: "Failed to delete auth user",
              details: authDeleteError.message || "Invalid API key",
              userId,
              hint: process.env.NODE_ENV === "development" 
                ? "For local development, ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local. For production, verify it's set in Vercel environment variables. The key must match the service_role key in Supabase Dashboard → Settings → API."
                : "The service role key may be incorrect. Verify it in Vercel environment variables matches Supabase Dashboard."
            },
            { status: authDeleteError.status || 500 }
          );
        }
        
        // Return error so user knows deletion failed
        return NextResponse.json(
          { 
            error: "Failed to delete auth user",
            details: authDeleteError.message || "Unknown error",
            userId,
            hint: authDeleteError.message?.includes("Invalid API key") 
              ? "The service role key may be incorrect. Verify it in .env.local (local) or Vercel (production) environment variables matches Supabase Dashboard."
              : undefined
          },
          { status: authDeleteError.status || 500 }
        );
      } else {
        console.log(`✅ Auth user ${userId} deleted from Supabase Auth`);
        console.log("Delete response:", deleteData);
      }
      } catch (authError) {
        console.error("❌ Exception deleting auth user:", authError);
        console.error("Error type:", authError instanceof Error ? authError.constructor.name : typeof authError);
        console.error("Error message:", authError instanceof Error ? authError.message : String(authError));
        console.error("Error stack:", authError instanceof Error ? authError.stack : 'No stack');

        // Check if it's a key format error from createAdminClient
        if (authError instanceof Error && authError.message.includes("Invalid service role key format")) {
          return NextResponse.json(
            {
              error: "Invalid service role key format",
              details: authError.message,
              hint: "The service role key in Vercel must be in JWT format (starts with 'eyJ'). Check Vercel Dashboard → Environment Variables → SUPABASE_SERVICE_ROLE_KEY"
            },
            { status: 500 }
          );
        }

        // Return error so user knows deletion failed
        return NextResponse.json(
          {
            error: "Failed to delete auth user",
            details: authError instanceof Error ? authError.message : String(authError),
            userId
          },
          { status: 500 }
        );
      }

    // Log deletion (optional - for audit purposes)
    console.log(`User account deleted: ${userId} at ${new Date().toISOString()}`);

    // Verify deletion by checking if user still exists
    // Use a fresh query to ensure we're not seeing cached data
    const { data: verifyUser, error: verifyError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (verifyError) {
      console.error("Error verifying deletion:", verifyError);
      // If we get an error, assume deletion worked (user might not exist)
    } else if (verifyUser) {
      console.error("User still exists after deletion attempt! User ID:", userId);
      console.error("Verification query returned:", verifyUser);
      return NextResponse.json(
        { 
          error: "User deletion failed - user still exists in database",
          userId,
          details: "The user record was not deleted. Check RLS policies and foreign key constraints."
        },
        { status: 500 }
      );
    }

    console.log(`✅ User ${userId} successfully deleted from public.users`);

    return NextResponse.json({ 
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    const errorMessage = error?.message || error?.code || "Failed to delete account";
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}

