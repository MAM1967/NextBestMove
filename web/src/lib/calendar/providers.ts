import * as client from "openid-client";

export type CalendarProvider = "google" | "outlook";

type ProviderConfig = {
  issuerUrl: string;
  scope: string;
  extraAuthParams?: Record<string, string>;
  clientIdEnv: string;
  clientSecretEnv: string;
};

const PROVIDERS: Record<CalendarProvider, ProviderConfig> = {
  google: {
    issuerUrl: "https://accounts.google.com",
    scope: "openid email https://www.googleapis.com/auth/calendar.readonly",
    extraAuthParams: {
      access_type: "offline",
      prompt: "select_account consent",
    },
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  outlook: {
    issuerUrl: "https://login.microsoftonline.com/common/v2.0",
    scope: "openid email https://graph.microsoft.com/Calendars.Read offline_access",
    clientIdEnv: "OUTLOOK_CLIENT_ID",
    clientSecretEnv: "OUTLOOK_CLIENT_SECRET",
  },
};

const configCache: Partial<
  Record<CalendarProvider, client.Configuration>
> = {};

export function isSupportedProvider(value: string): value is CalendarProvider {
  return value === "google" || value === "outlook";
}

async function getConfiguration(provider: CalendarProvider) {
  if (configCache[provider]) {
    return configCache[provider]!;
  }

  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv}/${config.clientSecretEnv} env vars are required for ${provider}`
    );
  }

  // Log client ID for debugging (first 30 chars only for security)
  console.log(`[OAuth Config] ${provider} client ID: ${clientId.substring(0, 30)}... (length: ${clientId.length})`);

  try {
    const serverUrl = new URL(config.issuerUrl);
    const configuration = await client.discovery(
      serverUrl,
      clientId,
      undefined, // metadata (optional)
      client.ClientSecretPost(clientSecret) // clientAuthentication
    );

    configCache[provider] = configuration;
    return configuration;
  } catch (error) {
    console.error(`Failed to discover ${provider} configuration:`, error);
    throw new Error(
      `Failed to discover ${provider} OAuth configuration: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getProviderConfiguration(
  provider: CalendarProvider
): Promise<client.Configuration> {
  return getConfiguration(provider);
}

export function buildAuthParams(provider: CalendarProvider) {
  const config = PROVIDERS[provider];
  return config.extraAuthParams ?? {};
}

export function getProviderScope(provider: CalendarProvider) {
  return PROVIDERS[provider].scope;
}

// PKCE helpers
export const randomPKCECodeVerifier = client.randomPKCECodeVerifier;
export const calculatePKCECodeChallenge = client.calculatePKCECodeChallenge;
export const randomState = client.randomState;
