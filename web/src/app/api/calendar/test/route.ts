import { NextResponse } from "next/server";
import { getProviderConfiguration } from "@/lib/calendar/providers";

export async function GET() {
  try {
    const config = await getProviderConfiguration("google");
    return NextResponse.json({
      success: true,
      hasAuthEndpoint: !!config.authorization_endpoint,
      authEndpoint: config.authorization_endpoint,
      clientId: config.client_id,
      issuer: config.issuer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

