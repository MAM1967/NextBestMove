import { NextResponse } from "next/server";

/**
 * Simple endpoint to check if CRON_SECRET is set (for debugging)
 * Usage: GET /api/test/check-env
 */
export async function GET() {
  const cronSecret = process.env.CRON_SECRET;
  const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY;

  return NextResponse.json({
    cronSecretExists: !!cronSecret,
    cronSecretLength: cronSecret?.length || 0,
    cronSecretStartsWith: cronSecret?.substring(0, 10) || "N/A",
    cronJobOrgApiKeyExists: !!cronJobOrgApiKey,
    cronJobOrgApiKeyLength: cronJobOrgApiKey?.length || 0,
    // Don't expose full secrets, just first few chars
  });
}

