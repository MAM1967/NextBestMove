import { createClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import {
  getEmailProviderConfiguration,
  getEmailProviderClientMetadata,
  type EmailProvider,
} from "@/lib/email/providers";

/**
 * Get access token for email provider, refreshing if necessary
 */
export async function getEmailAccessToken(
  userId: string,
  provider: EmailProvider
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const { data: connection, error } = await supabase
    .from("email_connections")
    .select("access_token, refresh_token, expires_at, status")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("status", "active")
    .single();

  if (error || !connection) {
    return null;
  }

  // Check if access token is still valid (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (connection.expires_at && connection.expires_at > now + 300) {
    const accessToken = decryptSecret(connection.access_token);
    return accessToken;
  }

  // Access token expired or missing, refresh it
  return await refreshEmailAccessToken(userId, provider);
}

/**
 * Refresh access token using refresh token
 */
async function refreshEmailAccessToken(
  userId: string,
  provider: EmailProvider
): Promise<string | null> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("email_connections")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (!connection?.refresh_token) {
    return null;
  }

  const refreshToken = decryptSecret(connection.refresh_token);
  if (!refreshToken) {
    return null;
  }

  try {
    const hostname = process.env.VERCEL_URL || "localhost";
    const config = await getEmailProviderConfiguration(provider, hostname);
    
    // Get token endpoint from configuration
    const tokenEndpoint = config.serverMetadata().token_endpoint;
    if (!tokenEndpoint) {
      throw new Error("Token endpoint not found in configuration");
    }

    // Get client credentials
    const { client_id, client_secret } = getEmailProviderClientMetadata(provider, hostname);

    // Build refresh token request
    const refreshParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id,
      client_secret,
    });

    // Make refresh token request
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: refreshParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokenSet = await response.json();

    if (!tokenSet.access_token) {
      return null;
    }

    const encryptedAccessToken = encryptSecret(tokenSet.access_token);
    const expiresAt = tokenSet.expires_in
      ? Math.floor(Date.now() / 1000) + tokenSet.expires_in
      : null;

    // Handle refresh token rotation: Google and Microsoft can return new refresh tokens
    const updateData: {
      access_token: string;
      expires_at: number | null;
      last_sync_at: string;
      error_message: null;
      status: string;
      refresh_token?: string;
    } = {
      access_token: encryptedAccessToken,
      expires_at: expiresAt,
      last_sync_at: new Date().toISOString(),
      error_message: null,
      status: "active",
    };

    // If a new refresh token is provided, encrypt and store it
    if (tokenSet.refresh_token) {
      updateData.refresh_token = encryptSecret(tokenSet.refresh_token);
    }

    // Update connection with new access token
    const { error: updateError } = await supabase
      .from("email_connections")
      .update(updateData)
      .eq("user_id", userId)
      .eq("provider", provider);

    if (updateError) {
      console.error("Error updating email connection:", updateError);
    }

    return tokenSet.access_token;
  } catch (error) {
    console.error("Error refreshing email access token:", error);
    
    // Mark connection as expired
    await supabase
      .from("email_connections")
      .update({
        status: "expired",
        error_message: error instanceof Error ? error.message : "Token refresh failed",
      })
      .eq("user_id", userId)
      .eq("provider", provider);

    return null;
  }
}

