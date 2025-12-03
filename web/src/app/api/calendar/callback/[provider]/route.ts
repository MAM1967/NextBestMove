import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProviderConfiguration,
  isSupportedProvider,
  type CalendarProvider,
} from "@/lib/calendar/providers";
import { encryptSecret } from "@/lib/security/encryption";
import * as client from "openid-client";

/**
 * Build a safe redirect URL, preventing open redirect vulnerabilities
 * Only allows relative paths within the application
 */
function buildRedirectUrl(
  origin: string,
  status: "success" | "error",
  callbackUrl?: string | null
) {
  // Whitelist of allowed callback paths (relative paths only)
  const ALLOWED_PATHS = [
    "/app/settings",
    "/onboarding",
    "/app",
  ];

  // Validate callbackUrl - must be a relative path starting with /
  let basePath = "/app/settings"; // Default fallback
  
  if (callbackUrl) {
    // Security: Only allow relative paths (must start with /)
    // Reject absolute URLs (http://, https://, //) to prevent open redirect
    if (
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("http://") &&
      !callbackUrl.startsWith("https://")
    ) {
      // Check if path is in whitelist or is a subpath of allowed paths
      const isAllowed = ALLOWED_PATHS.some(
        (allowed) =>
          callbackUrl === allowed || callbackUrl.startsWith(`${allowed}/`)
      );
      
      if (isAllowed) {
        basePath = callbackUrl;
      } else {
        // Log suspicious redirect attempt for security monitoring
        console.warn(
          `[Security] Blocked unauthorized redirect path: ${callbackUrl}`
        );
      }
    } else {
      // Log attempted open redirect attack
      console.error(
        `[Security] Blocked open redirect attempt: ${callbackUrl}`
      );
    }
  }

  // Always use origin (trusted) and basePath (validated relative path)
  const url = new URL(basePath, origin);
  if (status === "success") {
    url.searchParams.set("calendar", "success");
  } else {
    url.searchParams.set("calendar", "error");
  }
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const providerLower = providerParam?.toLowerCase();
  if (!isSupportedProvider(providerLower)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }
  const provider = providerLower as CalendarProvider;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(`nbm_calendar_state_${provider}`)?.value;
  const codeVerifier = cookieStore.get(`nbm_calendar_verifier_${provider}`)?.value;
  const userId = cookieStore.get(`nbm_calendar_user_${provider}`)?.value;
  const callbackUrl = cookieStore.get(`nbm_calendar_callback_${provider}`)?.value;

  if (!expectedState || !codeVerifier || !userId) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error", callbackUrl)
    );
  }

  const actualState = request.nextUrl.searchParams.get("state") || "";
  if (actualState !== expectedState) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error", callbackUrl)
    );
  }

  let refreshToken: string | undefined;
  let accessToken: string | undefined;

  try {
    console.log("Calendar callback: Starting", { userId, provider, hasState: !!expectedState, hasVerifier: !!codeVerifier });
    
    // Use admin client to bypass RLS since we're storing the connection server-side
    const supabase = createAdminClient();
    
    // Verify the user exists before proceeding
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();
    
    if (userError || !userData) {
      console.error("Calendar callback: User not found", { userId, error: userError });
      throw new Error(`User not found: ${userId}`);
    }
    
    console.log("Calendar callback: User verified", { userId });
    
    const redirectUri = `${request.nextUrl.origin}/api/calendar/callback/${provider}`;
    const config = await getProviderConfiguration(provider);

    // Use openid-client's authorizationCodeGrant function
    const tokenSet = await client.authorizationCodeGrant(
      config,
      new URL(request.url),
      {
        pkceCodeVerifier: codeVerifier,
        expectedState: expectedState,
      }
    );

    refreshToken = tokenSet.refresh_token;
    accessToken = tokenSet.access_token;
    const expiresAt = tokenSet.expires_in
      ? Math.floor(Date.now() / 1000) + tokenSet.expires_in
      : null;

    if (!refreshToken) {
      // Try to get existing refresh token
      const existing = await supabase
        .from("calendar_connections")
        .select("refresh_token")
        .eq("user_id", userId)
        .eq("provider", provider)
        .maybeSingle();

      if (!existing.data?.refresh_token) {
        throw new Error("Provider did not return a refresh token.");
      }
    }

    const encryptedRefresh = refreshToken
      ? encryptSecret(refreshToken)
      : (await supabase
          .from("calendar_connections")
          .select("refresh_token")
          .eq("user_id", userId)
          .eq("provider", provider)
          .maybeSingle()).data?.refresh_token || "";

    const encryptedAccess = accessToken ? encryptSecret(accessToken) : null;

    console.log("Calendar callback: Saving connection", { userId, provider, hasRefreshToken: !!encryptedRefresh, hasAccessToken: !!encryptedAccess });
    
    // Set last_sync_at to now since we successfully got tokens (connection is working)
    const now = new Date().toISOString();
    
    const { data: savedConnection, error } = await supabase
      .from("calendar_connections")
      .upsert(
        {
          user_id: userId,
          provider,
          refresh_token: encryptedRefresh,
          access_token: encryptedAccess,
          expires_at: expiresAt,
          calendar_id: "primary",
          status: "active",
          last_sync_at: now, // Set to now since connection is active
          error_message: null,
        },
        { onConflict: "user_id,provider" }
      )
      .select()
      .single();

    if (error) {
      console.error("Calendar callback: Database error", { error, userId, provider });
      throw error;
    }
    
    console.log("Calendar callback: Connection saved successfully", { connectionId: savedConnection?.id, userId, provider, lastSyncAt: now });
  } catch (error) {
    console.error("Calendar callback error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      provider,
      hasRefreshToken: !!refreshToken,
      hasAccessToken: !!accessToken,
    });
    
    // Try to save error message to database for debugging
    try {
      const supabase = createAdminClient();
      await supabase
        .from("calendar_connections")
        .upsert(
          {
            user_id: userId,
            provider,
            status: "error",
            error_message: error instanceof Error ? error.message : String(error),
            refresh_token: "", // Empty since connection failed
            calendar_id: "primary",
          },
          { onConflict: "user_id,provider" }
        );
    } catch (dbError) {
      console.error("Failed to save error to database:", dbError);
    }
    
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error", callbackUrl)
    );
  } finally {
    cookieStore.delete(`nbm_calendar_state_${provider}`);
    cookieStore.delete(`nbm_calendar_verifier_${provider}`);
    cookieStore.delete(`nbm_calendar_user_${provider}`);
    if (callbackUrl) {
      cookieStore.delete(`nbm_calendar_callback_${provider}`);
    }
  }

  return NextResponse.redirect(
    buildRedirectUrl(request.nextUrl.origin, "success", callbackUrl)
  );
}
