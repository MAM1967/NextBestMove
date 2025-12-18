import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { getProviderConfiguration, type CalendarProvider } from "./providers";

export type CalendarConnection = {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  refresh_token: string; // Encrypted
  access_token: string | null; // Encrypted
  expires_at: number | null;
  calendar_id: string;
  status: string;
  last_sync_at: string | null;
};

/**
 * Get a valid access token for a calendar connection.
 * Automatically refreshes if token expires soon (< 5 minutes).
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  connection: CalendarConnection
): Promise<string | null> {
  // If no access token, we need to refresh
  if (!connection.access_token) {
    return await refreshAccessToken(supabase, connection);
  }

  // Check if token expires soon (< 5 minutes)
  // expires_at is stored as Unix timestamp in seconds
  const expiresAt = connection.expires_at;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (expiresAt && expiresAt < nowSeconds + 5 * 60) {
    // Refresh proactively
    return await refreshAccessToken(supabase, connection);
  }

  // Decrypt and return current token
  return decryptSecret(connection.access_token);
}

/**
 * Refresh an expired access token using the refresh token.
 * Handles refresh token rotation (Google and Microsoft can return new refresh tokens).
 */
export async function refreshAccessToken(
  supabase: SupabaseClient,
  connection: CalendarConnection
): Promise<string | null> {
  try {
    const config = await getProviderConfiguration(connection.provider);
    const refreshToken = decryptSecret(connection.refresh_token);

    if (!refreshToken) {
      console.error("[Token Refresh] Failed to decrypt refresh token");
      return null;
    }

    // Use openid-client to refresh the token
    // Note: openid-client v6 uses refreshTokenGrant differently
    // We'll use the HTTP API directly for more control
    const tokenEndpoint = config.serverMetadata().token_endpoint;
    if (!tokenEndpoint) {
      throw new Error("Token endpoint not found in configuration");
    }

    // Get client credentials from environment (same as in providers.ts)
    const providerConfig =
      connection.provider === "google"
        ? {
            clientIdEnv: "GOOGLE_CLIENT_ID",
            clientSecretEnv: "GOOGLE_CLIENT_SECRET",
          }
        : {
            clientIdEnv: "OUTLOOK_CLIENT_ID",
            clientSecretEnv: "OUTLOOK_CLIENT_SECRET",
          };

    const clientId = process.env[providerConfig.clientIdEnv]?.trim();
    const clientSecret = process.env[providerConfig.clientSecretEnv]?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        `${providerConfig.clientIdEnv}/${providerConfig.clientSecretEnv} env vars are required`
      );
    }

    // Build refresh token request body
    // Microsoft Graph requires different parameters than Google
    const refreshParams: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    };

    // Microsoft Graph requires client_secret in body, Google can use it in Authorization header
    if (connection.provider === "outlook") {
      refreshParams.client_secret = clientSecret;
    } else {
      // Google: can include client_secret in body or use Basic Auth
      refreshParams.client_secret = clientSecret;
    }

    console.log(
      `[Token Refresh] Attempting to refresh ${connection.provider} token`,
      {
        provider: connection.provider,
        tokenEndpoint: tokenEndpoint.substring(0, 50) + "...",
        hasRefreshToken: !!refreshToken,
        clientIdPrefix: clientId.substring(0, 30) + "...",
      }
    );

    // Make refresh token request
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(refreshParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Token refresh failed: ${errorText}`;

      // Parse error for better messaging
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error === "deleted_client") {
          errorMessage = `OAuth client was deleted: The OAuth client used to connect your calendar has been deleted. Please disconnect and reconnect your calendar with the current OAuth client. Original error: ${errorText}`;
        } else if (errorData.error === "invalid_client") {
          errorMessage = `OAuth client mismatch: The refresh token was issued by a different OAuth client. Please disconnect and reconnect your calendar. Original error: ${errorText}`;
        } else if (errorData.error === "invalid_grant") {
          errorMessage = `Refresh token invalid or expired: Please disconnect and reconnect your calendar. Original error: ${errorText}`;
        } else if (errorData.error === "invalid_request") {
          errorMessage = `Invalid refresh token request: ${
            errorData.error_description || errorText
          }`;
        }
      } catch {
        // If parsing fails, use original error message
      }

      console.error(
        `[Token Refresh] Refresh failed for ${connection.provider}:`,
        {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        }
      );

      throw new Error(errorMessage);
    }

    const tokenSet = await response.json();

    if (!tokenSet.access_token) {
      console.error("[Token Refresh] No access token in refresh response");
      return null;
    }

    // Encrypt and store the new tokens
    const encryptedAccessToken = encryptSecret(tokenSet.access_token);
    // Store expires_at as Unix timestamp in seconds
    const expiresAt = tokenSet.expires_in
      ? Math.floor(Date.now() / 1000) + tokenSet.expires_in
      : null;

    // Handle refresh token rotation: Google and Microsoft can return new refresh tokens
    // If a new refresh_token is provided, we should update it
    const updateData: {
      access_token: string;
      expires_at: number | null;
      last_sync_at: string;
      status: string;
      error_message: null;
      refresh_token?: string;
    } = {
      access_token: encryptedAccessToken,
      expires_at: expiresAt,
      last_sync_at: new Date().toISOString(),
      status: "active",
      error_message: null,
    };

    // If a new refresh token is provided, encrypt and store it
    // This is important for token rotation (Google and Microsoft can rotate refresh tokens)
    if (tokenSet.refresh_token) {
      console.log(
        `[Token Refresh] New refresh token provided for ${connection.provider}, rotating token`
      );
      updateData.refresh_token = encryptSecret(tokenSet.refresh_token);
    }

    // Update the connection in the database
    const { error } = await supabase
      .from("calendar_connections")
      .update(updateData)
      .eq("id", connection.id);

    if (error) {
      console.error(
        "[Token Refresh] Failed to update calendar connection:",
        error
      );
      return null;
    }

    console.log(
      `[Token Refresh] Successfully refreshed ${connection.provider} token`,
      {
        provider: connection.provider,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        tokenRotated: !!tokenSet.refresh_token,
      }
    );

    return tokenSet.access_token;
  } catch (error) {
    console.error(
      `[Token Refresh] Failed to refresh access token for ${connection.provider}:`,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );

    // Mark connection as expired
    await supabase
      .from("calendar_connections")
      .update({
        status: "expired",
        error_message:
          error instanceof Error ? error.message : "Token refresh failed",
      })
      .eq("id", connection.id);

    return null;
  }
}

/**
 * Get the active calendar connection for a user.
 */
export async function getActiveConnection(
  supabase: SupabaseClient,
  userId: string
): Promise<CalendarConnection | null> {
  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return data as CalendarConnection;
}
