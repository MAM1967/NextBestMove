import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/calendar/tokens";
import type { CalendarConnection } from "@/lib/calendar/tokens";

/**
 * GET /api/cron/calendar-token-maintenance
 *
 * Cron job to proactively refresh calendar tokens expiring within 24 hours.
 * Runs daily at 2 AM UTC.
 *
 * This endpoint:
 * 1. Finds all active calendar connections
 * 2. Identifies tokens expiring within 24 hours
 * 3. Proactively refreshes them
 * 4. Marks connections as expired if refresh fails
 * 5. Updates last_sync_at on successful refresh
 *
 * This prevents token expiration for inactive users and ensures
 * calendar connections remain stable long-term.
 *
 * This endpoint is called by cron-job.org and requires authentication via
 * the Authorization header with a secret token (CRON_SECRET or CRON_JOB_ORG_API_KEY).
 * See docs/Architecture/Architecture_Summary.md for cron job configuration details.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret - support Authorization header (cron-job.org API key or CRON_SECRET), and query param (cron-job.org fallback)
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret")?.trim().replace(/\r?\n/g, "");
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, "");
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(
      /\r?\n/g,
      ""
    );

    // Debug logging for staging (to diagnose authorization issues)
    const hostname = new URL(request.url).hostname;
    const isStaging = hostname === "staging.nextbestmove.app" || hostname?.endsWith(".vercel.app");
    if (isStaging) {
      console.log("[Calendar Token Maintenance] Auth Debug:", {
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length || 0,
        authHeaderPrefix: authHeader?.substring(0, 30) || "none",
        hasQuerySecret: !!querySecret,
        querySecretLength: querySecret?.length || 0,
        hasCronSecret: !!cronSecret,
        cronSecretLength: cronSecret?.length || 0,
        hasCronJobOrgApiKey: !!cronJobOrgApiKey,
        cronJobOrgApiKeyLength: cronJobOrgApiKey?.length || 0,
      });
    }

    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret);

    if (!isAuthorized) {
      if (isStaging) {
        console.error("[Calendar Token Maintenance] Authorization failed:", {
          authHeaderMatch: cronSecret ? authHeader === `Bearer ${cronSecret}` : false,
          apiKeyMatch: cronJobOrgApiKey ? authHeader === `Bearer ${cronJobOrgApiKey}` : false,
          queryParamMatch: cronSecret ? querySecret === cronSecret : false,
          querySecretPrefix: querySecret ? `${querySecret.substring(0, 10)}...` : "null",
          cronSecretPrefix: cronSecret ? `${cronSecret.substring(0, 10)}...` : "null",
          querySecretLength: querySecret?.length || 0,
          cronSecretLength: cronSecret?.length || 0,
          secretsMatch: querySecret === cronSecret,
        });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Find all active calendar connections
    const { data: connections, error: fetchError } = await adminClient
      .from("calendar_connections")
      .select("*")
      .eq("status", "active");

    if (fetchError) {
      console.error(
        "[Calendar Token Maintenance] Failed to fetch connections:",
        fetchError
      );
      return NextResponse.json(
        { error: "Failed to fetch connections", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active calendar connections found",
        refreshed: 0,
        expired: 0,
        skipped: 0,
        errors: 0,
      });
    }

    console.log(
      `[Calendar Token Maintenance] Found ${connections.length} active connections to check`
    );

    // Calculate 24 hours from now (in seconds)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const twentyFourHoursFromNow = nowSeconds + 24 * 60 * 60;

    let refreshed = 0;
    let expired = 0;
    let skipped = 0;
    let errors = 0;

    // Process each connection
    for (const connection of connections as CalendarConnection[]) {
      try {
        // Check if token expires within 24 hours
        const expiresAt = connection.expires_at;

        // If no expires_at, we should refresh to get one
        if (!expiresAt) {
          console.log(
            `[Calendar Token Maintenance] Connection ${connection.id} has no expires_at, refreshing`
          );
        } else if (expiresAt > twentyFourHoursFromNow) {
          // Token expires more than 24 hours from now, skip
          skipped++;
          continue;
        }

        // Token expires within 24 hours (or has no expiry), refresh it
        console.log(
          `[Calendar Token Maintenance] Refreshing token for connection ${connection.id} (${connection.provider})`
        );

        // Refresh token (pass undefined for hostname since this is server-side)
        const newAccessToken = await refreshAccessToken(
          adminClient,
          connection,
          undefined
        );

        if (newAccessToken) {
          refreshed++;
          console.log(
            `[Calendar Token Maintenance] Successfully refreshed token for connection ${connection.id}`
          );
        } else {
          // Refresh failed, connection should be marked as expired by refreshAccessToken
          expired++;
          console.log(
            `[Calendar Token Maintenance] Failed to refresh token for connection ${connection.id}, marked as expired`
          );
        }
      } catch (error) {
        errors++;
        console.error(
          `[Calendar Token Maintenance] Error processing connection ${connection.id}:`,
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }
        );

        // Mark connection as expired on error
        try {
          await adminClient
            .from("calendar_connections")
            .update({
              status: "expired",
              error_message:
                error instanceof Error
                  ? error.message
                  : "Token maintenance failed",
            })
            .eq("id", connection.id);
        } catch (updateError) {
          console.error(
            `[Calendar Token Maintenance] Failed to mark connection ${connection.id} as expired:`,
            updateError
          );
        }
      }
    }

    const summary = {
      success: true,
      message: "Calendar token maintenance completed",
      total: connections.length,
      refreshed,
      expired,
      skipped,
      errors,
    };

    console.log("[Calendar Token Maintenance] Summary:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Calendar Token Maintenance] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
