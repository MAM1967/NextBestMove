import { NextResponse } from "next/server";
import { getProviderConfiguration } from "@/lib/calendar/providers";

export async function GET() {
  try {
    const config = await getProviderConfiguration("google");
    const serverMetadata = config.serverMetadata();
    const clientMetadata = config.clientMetadata();
    return NextResponse.json({
      success: true,
      hasAuthEndpoint: !!serverMetadata.authorization_endpoint,
      authEndpoint: serverMetadata.authorization_endpoint,
      clientId: clientMetadata.client_id,
      issuer: serverMetadata.issuer,
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

