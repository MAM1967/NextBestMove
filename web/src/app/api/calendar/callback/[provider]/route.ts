import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getProviderConfiguration,
  isSupportedProvider,
  type CalendarProvider,
} from "@/lib/calendar/providers";
import { encryptSecret } from "@/lib/security/encryption";
import * as client from "openid-client";

function buildRedirectUrl(origin: string, status: "success" | "error") {
  const url = new URL("/app/settings", origin);
  url.searchParams.set("calendar", status);
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

  if (!expectedState || !codeVerifier || !userId) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error")
    );
  }

  const actualState = request.nextUrl.searchParams.get("state") || "";
  if (actualState !== expectedState) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error")
    );
  }

  try {
    const supabase = await createClient();
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

    const refreshToken = tokenSet.refresh_token;
    const accessToken = tokenSet.access_token;
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

    const { error } = await supabase
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
          last_sync_at: null,
          error_message: null,
        },
        { onConflict: "user_id,provider" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Calendar callback error:", error);
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "error")
    );
  } finally {
    cookieStore.delete(`nbm_calendar_state_${provider}`);
    cookieStore.delete(`nbm_calendar_verifier_${provider}`);
    cookieStore.delete(`nbm_calendar_user_${provider}`);
  }

  return NextResponse.redirect(
    buildRedirectUrl(request.nextUrl.origin, "success")
  );
}
