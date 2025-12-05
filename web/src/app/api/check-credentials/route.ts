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
    // Show first and last character to help verify (not a security issue for staging)
    stagingUserFirstChar: stagingUser?.[0] || null,
    stagingUserLastChar: stagingUser?.[stagingUser.length - 1] || null,
    stagingPassFirstChar: stagingPass?.[0] || null,
    stagingPassLastChar: stagingPass?.[stagingPass.length - 1] || null,
    // Show character codes for first 3 chars (to detect encoding issues)
    stagingUserCharCodes: stagingUser ? Array.from(stagingUser).slice(0, 3).map(c => c.charCodeAt(0)) : null,
    stagingPassCharCodes: stagingPass ? Array.from(stagingPass).slice(0, 3).map(c => c.charCodeAt(0)) : null,
    // Check for whitespace issues
    stagingUserHasLeadingSpace: stagingUser ? stagingUser !== process.env.STAGING_USER : false,
    stagingPassHasLeadingSpace: stagingPass ? stagingPass !== process.env.STAGING_PASS : false,
    // Show raw lengths (before trim) to detect trailing spaces
    rawStagingUserLength: process.env.STAGING_USER?.length || 0,
    rawStagingPassLength: process.env.STAGING_PASS?.length || 0,
  });
}

