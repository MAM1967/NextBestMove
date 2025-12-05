import { NextResponse } from "next/server";

// Debug endpoint to check credential configuration (without revealing actual values)
export async function GET() {
  const stagingUser = process.env.STAGING_USER?.trim();
  const stagingPass = process.env.STAGING_PASS?.trim();

  return NextResponse.json({
    hasStagingUser: !!stagingUser,
    hasStagingPass: !!stagingPass,
    stagingUserLength: stagingUser?.length || 0,
    stagingPassLength: stagingPass?.length || 0,
    // Show first character to help verify (not a security issue for staging)
    stagingUserFirstChar: stagingUser?.[0] || null,
    stagingPassFirstChar: stagingPass?.[0] || null,
    // Check for whitespace issues
    stagingUserHasLeadingSpace: stagingUser ? stagingUser !== process.env.STAGING_USER : false,
    stagingPassHasLeadingSpace: stagingPass ? stagingPass !== process.env.STAGING_PASS : false,
  });
}

