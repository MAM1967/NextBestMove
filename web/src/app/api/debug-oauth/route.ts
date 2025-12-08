import { NextResponse } from "next/server";

/**
 * Debug endpoint to check OAuth configuration
 * Only accessible on staging/production
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Only allow on staging/production
  if (hostname !== "staging.nextbestmove.app" && hostname !== "nextbestmove.app" && !hostname.includes("vercel.app")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const origin = url.origin;
  const expectedRedirectUri = `${origin}/api/calendar/callback/google`;
  
  // Check if this is production or staging
  const isProduction = hostname === "nextbestmove.app";
  const isStaging = hostname === "staging.nextbestmove.app" || hostname.includes("vercel.app");
  
  // Expected client IDs based on environment
  const PRODUCTION_CLIENT_ID_PREFIX = "732850218816-5een"; // NextBestMove (production)
  const STAGING_CLIENT_ID_PREFIX = "732850218816-kgrh"; // NextBestMove-Test (staging)
  
  const isProductionClient = googleClientId.startsWith(PRODUCTION_CLIENT_ID_PREFIX);
  const isStagingClient = googleClientId.startsWith(STAGING_CLIENT_ID_PREFIX);
  
  return NextResponse.json({
    hostname,
    origin,
    vercelEnv: process.env.VERCEL_ENV,
    isProduction,
    isStaging,
    // OAuth Configuration
    hasGoogleClientId: !!googleClientId,
    googleClientIdLength: googleClientId.length,
    googleClientIdPrefix: googleClientId.substring(0, 30) || "MISSING",
    googleClientIdFull: googleClientId || "MISSING",
    hasGoogleClientSecret: !!googleClientSecret,
    googleClientSecretLength: googleClientSecret.length,
    // Expected vs Actual
    expectedRedirectUri,
    // Client ID Validation
    isProductionClient,
    isStagingClient,
    clientIdMatchesEnvironment: (isProduction && isProductionClient) || (isStaging && isStagingClient),
    // Recommendations
    recommendation: (() => {
      if (!googleClientId) {
        return "GOOGLE_CLIENT_ID is not set";
      }
      if (isProduction && !isProductionClient) {
        return "Production should use NextBestMove client (starts with 732850218816-5een)";
      }
      if (isStaging && !isStagingClient) {
        return "Staging should use NextBestMove-Test client (starts with 732850218816-kgrh)";
      }
      return "Configuration looks correct";
    })(),
  });
}

