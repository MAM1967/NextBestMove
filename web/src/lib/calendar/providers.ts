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
    // Using calendar.readonly as required by Google Trust and Safety
    // Must NOT use calendar.calendars.readonly (remove from Google Cloud Console)
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
    scope:
      "openid email https://graph.microsoft.com/Calendars.Read offline_access",
    clientIdEnv: "OUTLOOK_CLIENT_ID",
    clientSecretEnv: "OUTLOOK_CLIENT_SECRET",
  },
};

const configCache: Partial<Record<CalendarProvider, client.Configuration>> = {};

export function isSupportedProvider(value: string): value is CalendarProvider {
  return value === "google" || value === "outlook";
}

async function getConfiguration(provider: CalendarProvider) {
  if (configCache[provider]) {
    return configCache[provider]!;
  }

  const config = PROVIDERS[provider];

  // WORKAROUND: Vercel sometimes doesn't pass env vars correctly to runtime
  // Override based on VERCEL_ENV to ensure correct OAuth client IDs are used
  let clientId = process.env[config.clientIdEnv]?.trim();
  let clientSecret = process.env[config.clientSecretEnv]?.trim();

  const isPreview = process.env.VERCEL_ENV === "preview";
  const isProduction = process.env.VERCEL_ENV === "production";

  if (provider === "google") {
    if (isPreview) {
      // Staging: Use NextBestMove-Test client
      const stagingClientId =
        "732850218816-kgrhcoagfcibsrrta1q8uk86jo4o8dk96cm.apps.googleusercontent.com";
      const vercelProvided = clientId;

      // Only override if Vercel provided wrong client ID or if client ID is missing
      if (!vercelProvided || !vercelProvided.startsWith("732850218816-kgrh")) {
        if (vercelProvided !== stagingClientId) {
          console.log(
            "🔧 WORKAROUND: Overriding GOOGLE_CLIENT_ID for Preview build"
          );
          console.log(
            `   Vercel provided: ${
              vercelProvided
                ? `${vercelProvided.substring(0, 30)}...`
                : "MISSING"
            }`
          );
          console.log(
            `   Overriding with: ${stagingClientId.substring(0, 30)}...`
          );
        }
        clientId = stagingClientId;
        // Note: Client secret should still come from env var (Vercel usually provides this correctly)
      }
    } else if (isProduction) {
      // Production: Use NextBestMove client
      const productionClientId =
        "732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com";
      const vercelProvided = clientId;

      // Only override if Vercel provided wrong client ID (staging) or if client ID is missing
      if (!vercelProvided || !vercelProvided.startsWith("732850218816-5een")) {
        if (vercelProvided !== productionClientId) {
          console.log(
            "🔧 WORKAROUND: Overriding GOOGLE_CLIENT_ID for Production build"
          );
          console.log(
            `   Vercel provided: ${
              vercelProvided
                ? `${vercelProvided.substring(0, 30)}...`
                : "MISSING"
            }`
          );
          console.log(
            `   Overriding with: ${productionClientId.substring(0, 30)}...`
          );
        }
        clientId = productionClientId;
      }
      
      // Log client secret status for debugging (first 10 chars only)
      if (clientSecret) {
        console.log(
          `[OAuth Config] Production client secret: ${clientSecret.substring(0, 10)}... (length: ${clientSecret.length})`
        );
      } else {
        console.error(
          "[OAuth Config] Production client secret is MISSING!"
        );
      }
    }
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv}/${config.clientSecretEnv} env vars are required for ${provider}`
    );
  }

  // Log client ID for debugging (first 30 chars only for security)
  console.log(
    `[OAuth Config] ${provider} client ID: ${clientId.substring(
      0,
      30
    )}... (length: ${clientId.length})`
  );

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
