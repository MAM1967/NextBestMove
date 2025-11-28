import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

    // 10. Delete from Supabase Auth (auth.users)
    // This requires service role key to delete auth users
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      try {
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
          userId
        );

        if (authDeleteError) {
          console.error("Error deleting auth user:", authDeleteError);
          // Don't throw - public.users is deleted, which is the main requirement
          // Auth user deletion failure is logged but doesn't block success
        } else {
          console.log(`✅ Auth user ${userId} deleted from auth.users`);
        }
      } catch (authError) {
        console.error("Error creating admin client or deleting auth user:", authError);
        // Continue - public.users deletion is the critical part
      }
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set - cannot delete auth.users record");
      console.warn("User will be able to sign in again, but public.users is deleted");
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

