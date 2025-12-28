import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getEmailProviderConfiguration,
  getEmailProviderClientMetadata,
  getEmailProviderScope,
  buildEmailAuthParams,
  isSupportedEmailProvider,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomState,
  type EmailProvider,
} from "@/lib/email/providers";

/**
 * GET /api/email/connect/[provider]
 * 
 * Initiates OAuth flow for email connection (Gmail or Outlook).
 * Redirects user to provider's OAuth consent screen.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const providerLower = providerParam?.toLowerCase();
  
  if (!isSupportedEmailProvider(providerLower)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = providerLower as EmailProvider;
  const origin = request.nextUrl.origin;
  const hostname = request.nextUrl.hostname;
  const redirectUri = `${origin}/api/email/callback/${provider}`;

  try {
    const config = await getEmailProviderConfiguration(provider, hostname);
    const serverMetadata = config.serverMetadata();
    const authorizationEndpoint = serverMetadata.authorization_endpoint;

    if (!authorizationEndpoint) {
      console.error("No authorization_endpoint in config", serverMetadata);
      return NextResponse.json(
        { error: "Failed to get authorization endpoint" },
        { status: 500 }
      );
    }

    const clientMetadata = getEmailProviderClientMetadata(provider, hostname);
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();
    
    const authorizationUrl = new URL(authorizationEndpoint);
    authorizationUrl.searchParams.set("client_id", clientMetadata.client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", getEmailProviderScope(provider));
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);

    // Add extra auth params (e.g., access_type=offline for Gmail)
    const extraParams = buildEmailAuthParams(provider);
    for (const [key, value] of Object.entries(extraParams)) {
      authorizationUrl.searchParams.set(key, value);
    }

    const cookieStore = await cookies();
    const maxAge = 60 * 5; // 5 minutes

    cookieStore.set(`nbm_email_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set(`nbm_email_verifier_${provider}`, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set(`nbm_email_user_${provider}`, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Store callbackUrl if provided (for onboarding redirect)
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      const ALLOWED_PATHS = [
        "/app/settings",
        "/onboarding",
        "/app",
      ];

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
        cookieStore.set(`nbm_email_callback_${provider}`, callbackUrl, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });
      }
    }

    return NextResponse.redirect(authorizationUrl.toString());
  } catch (error) {
    console.error("Email connect error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate email connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}






