import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Test endpoint to check if middleware ran
// This endpoint itself doesn't require Basic Auth (it's an API route)
// But it will show if middleware executed
export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  return NextResponse.json({
    message: "Middleware test endpoint",
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader?.substring(0, 10) || null,
    // This endpoint is accessible without Basic Auth (API routes are excluded)
    // But if middleware ran, we can see if it processed the request
  });
}

