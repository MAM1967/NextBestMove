import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  buildAuthParams,
  getProviderConfiguration,
  getProviderScope,
  isSupportedProvider,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomState,
  type CalendarProvider,
} from "@/lib/calendar/providers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const providerLower = providerParam?.toLowerCase();
  if (!isSupportedProvider(providerLower)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = providerLower as CalendarProvider;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/calendar/callback/${provider}`;

  try {
    const config = await getProviderConfiguration(provider);
    const serverMetadata = config.serverMetadata();
    const authorizationEndpoint = serverMetadata.authorization_endpoint;
    const clientMetadata = config.clientMetadata();
    
    console.log(`[Calendar Connect] ${provider} - Client ID: ${clientMetadata.client_id.substring(0, 30)}..., Redirect URI: ${redirectUri}`);

    if (!authorizationEndpoint) {
      console.error("No authorization_endpoint in config", serverMetadata);
      return NextResponse.json(
        { error: "Failed to get authorization endpoint" },
        { status: 500 }
      );
    }

    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();
    const authorizationUrl = new URL(authorizationEndpoint);
    authorizationUrl.searchParams.set("client_id", clientMetadata.client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", getProviderScope(provider));
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);

    // Add extra auth params (e.g., access_type=offline for Google)
    const extraParams = buildAuthParams(provider);
    for (const [key, value] of Object.entries(extraParams)) {
      authorizationUrl.searchParams.set(key, value);
    }

    const cookieStore = await cookies();
    const maxAge = 60 * 5; // 5 minutes

    cookieStore.set(`nbm_calendar_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set(`nbm_calendar_verifier_${provider}`, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set(`nbm_calendar_user_${provider}`, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Store callbackUrl if provided (for onboarding redirect)
    // Security: Validate callbackUrl to prevent open redirect attacks
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      // Whitelist of allowed callback paths (relative paths only)
      const ALLOWED_PATHS = [
        "/app/settings",
        "/onboarding",
        "/app",
      ];

      // Validate: Only allow relative paths starting with /
      // Reject absolute URLs to prevent open redirect
      const isValidPath =
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//") &&
        !callbackUrl.startsWith("http://") &&
        !callbackUrl.startsWith("https://") &&
        ALLOWED_PATHS.some(
          (allowed) =>
            callbackUrl === allowed || callbackUrl.startsWith(`${allowed}/`)
        );

      if (isValidPath) {
        cookieStore.set(`nbm_calendar_callback_${provider}`, callbackUrl, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });
      } else {
        // Log suspicious redirect attempt for security monitoring
        console.warn(
          `[Security] Blocked invalid callbackUrl: ${callbackUrl}`
        );
      }
    }

    return NextResponse.redirect(authorizationUrl.toString());
  } catch (error) {
    console.error("Calendar connect error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate calendar connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
