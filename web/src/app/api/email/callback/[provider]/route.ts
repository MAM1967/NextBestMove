import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEmailProviderConfiguration,
  isSupportedEmailProvider,
  type EmailProvider,
} from "@/lib/email/providers";
import { encryptSecret } from "@/lib/security/encryption";
import * as client from "openid-client";

/**
 * Build a safe redirect URL, preventing open redirect vulnerabilities
 */
function buildRedirectUrl(
  origin: string,
  status: "success" | "error",
  callbackUrl?: string | null
) {
  const ALLOWED_PATHS = ["/app/settings", "/onboarding", "/app"];

  let basePath = "/app/settings"; // Default fallback

  if (callbackUrl) {
    if (
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("http://") &&
      !callbackUrl.startsWith("https://")
    ) {
      const isAllowed = ALLOWED_PATHS.some(
        (allowed) =>
          callbackUrl === allowed || callbackUrl.startsWith(`${allowed}/`)
      );

      if (isAllowed) {
        basePath = callbackUrl;
      } else {
        console.warn(
          `[Security] Blocked unauthorized redirect path: ${callbackUrl}`
        );
      }
    } else {
      console.error(`[Security] Blocked open redirect attempt: ${callbackUrl}`);
    }
  }

  const url = new URL(basePath, origin);
  if (status === "success") {
    url.searchParams.set("email", "success");
  } else {
    url.searchParams.set("email", "error");
  }
  return url;
}

/**
 * GET /api/email/callback/[provider]
 * 
 * Handles OAuth callback from email provider (Gmail or Outlook).
 * Exchanges authorization code for tokens and stores connection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const providerLower = providerParam?.toLowerCase();
  
  if (!isSupportedEmailProvider(providerLower)) {
    return NextResponse.json(
      { error: "Unsupported provider" },
      { status: 400 }
    );
  }
  
  const provider = providerLower as EmailProvider;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(`nbm_email_state_${provider}`)?.value;
  const codeVerifier = cookieStore.get(`nbm_email_verifier_${provider}`)?.value;
  const userId = cookieStore.get(`nbm_email_user_${provider}`)?.value;
  const callbackUrl = cookieStore.get(`nbm_email_callback_${provider}`)?.value;

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
  let emailAddress: string | undefined;

  try {
    console.log("Email callback: Starting", {
      userId,
      provider,
      hasState: !!expectedState,
      hasVerifier: !!codeVerifier,
    });

    const supabase = createAdminClient();

    // Verify the user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("Email callback: User not found", {
        userId,
        error: userError,
      });
      throw new Error(`User not found: ${userId}`);
    }

    emailAddress = userData.email || undefined;

    const redirectUri = `${request.nextUrl.origin}/api/email/callback/${provider}`;
    const hostname = request.nextUrl.hostname;
    const config = await getEmailProviderConfiguration(provider, hostname);

    // Exchange authorization code for tokens
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
        .from("email_connections")
        .select("refresh_token")
        .eq("user_id", userId)
        .eq("provider", provider)
        .maybeSingle();

      if (!existing.data?.refresh_token) {
        throw new Error("Provider did not return a refresh token.");
      }
    }

    // Encrypt tokens before storing
    const encryptedRefresh = refreshToken
      ? encryptSecret(refreshToken)
      : (
          await supabase
            .from("email_connections")
            .select("refresh_token")
            .eq("user_id", userId)
            .eq("provider", provider)
            .maybeSingle()
        ).data?.refresh_token || "";

    const encryptedAccess = accessToken ? encryptSecret(accessToken) : null;

    console.log("Email callback: Saving connection", {
      userId,
      provider,
      hasRefreshToken: !!encryptedRefresh,
      hasAccessToken: !!encryptedAccess,
    });

    const now = new Date().toISOString();

    const { data: savedConnection, error } = await supabase
      .from("email_connections")
      .upsert(
        {
          user_id: userId,
          provider,
          refresh_token: encryptedRefresh,
          access_token: encryptedAccess,
          expires_at: expiresAt,
          email_address: emailAddress || "",
          status: "active",
          last_sync_at: now,
          error_message: null,
        },
        { onConflict: "user_id,provider" }
      )
      .select()
      .single();

    if (error) {
      console.error("Email callback: Database error", {
        error,
        userId,
        provider,
      });
      throw error;
    }

    console.log("Email callback: Connection saved successfully", {
      connectionId: savedConnection?.id,
      userId,
      provider,
      lastSyncAt: now,
    });
  } catch (error) {
    console.error("Email callback error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      provider,
      hasRefreshToken: !!refreshToken,
      hasAccessToken: !!accessToken,
    });

    // Try to save error message to database
    try {
      const supabase = createAdminClient();
      await supabase.from("email_connections").upsert(
        {
          user_id: userId,
          provider,
          status: "error",
          error_message: error instanceof Error ? error.message : String(error),
          refresh_token: "",
          email_address: emailAddress || "",
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
    cookieStore.delete(`nbm_email_state_${provider}`);
    cookieStore.delete(`nbm_email_verifier_${provider}`);
    cookieStore.delete(`nbm_email_user_${provider}`);
    if (callbackUrl) {
      cookieStore.delete(`nbm_email_callback_${provider}`);
    }
  }

  return NextResponse.redirect(
    buildRedirectUrl(request.nextUrl.origin, "success", callbackUrl)
  );
}






