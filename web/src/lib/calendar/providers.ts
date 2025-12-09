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

async function getConfiguration(
  provider: CalendarProvider,
  hostname?: string
) {
  // Use cache to avoid repeated discovery calls
  if (configCache[provider]) {
    return configCache[provider]!;
  }

  const config = PROVIDERS[provider];

  // Detect environment for logging/debugging purposes only
  const vercelEnv = process.env.VERCEL_ENV;
  const isProduction = vercelEnv === "production" || hostname === "nextbestmove.app";
  const isPreview = vercelEnv === "preview" || hostname?.includes("vercel.app") || hostname === "staging.nextbestmove.app";
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname?.startsWith("localhost:") || hostname?.startsWith("127.0.0.1:");

  // Get credentials from environment variables
  let clientId = process.env[config.clientIdEnv]?.trim();
  let clientSecret = process.env[config.clientSecretEnv]?.trim();

  // WORKAROUND: ALWAYS force staging Google OAuth credentials for Preview builds
  // Vercel sometimes provides wrong env vars, so we override at runtime unconditionally
  if (provider === "google" && isPreview && !isLocalhost) {
    const stagingClientId = "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
    const stagingClientSecret = "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";
    
    // Always override for staging to ensure correct credentials
    const originalClientId = clientId;
    clientId = stagingClientId;
    clientSecret = stagingClientSecret;
    
    // Log the override for debugging
    if (originalClientId !== stagingClientId) {
      console.log("🔧 RUNTIME WORKAROUND: Overriding Google OAuth credentials for staging");
      console.log(`   Original client ID: ${originalClientId ? `${originalClientId.substring(0, 30)}...` : "MISSING"}`);
      console.log(`   Overriding with staging client ID: ${stagingClientId.substring(0, 30)}...`);
    }
  }

  // Log environment detection for debugging
  if (provider === "google") {
    console.log(`[OAuth Config] Environment detection:`, {
      vercelEnv: vercelEnv || "NOT_SET",
      hostname: hostname || "NOT_PROVIDED",
      isProduction,
      isPreview,
      isLocalhost,
      clientIdPrefix: clientId?.substring(0, 30) || "MISSING",
      clientSecretPrefix: clientSecret?.substring(0, 10) || "MISSING",
    });
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv}/${config.clientSecretEnv} env vars are required for ${provider}`
    );
  }

  // Log final configuration being used (first 30 chars only for security)
  console.log(
    `[OAuth Config] ${provider} Final Configuration:`,
    {
      clientId: `${clientId.substring(0, 30)}... (length: ${clientId.length})`,
      clientSecretPrefix: `${clientSecret.substring(0, 10)}... (length: ${clientSecret.length})`,
    }
  );

  try {
    const serverUrl = new URL(config.issuerUrl);
    const discoveryUrl = `${serverUrl.origin}/.well-known/openid-configuration`;
    
    console.log(`[OAuth Discovery] Attempting to fetch discovery document for ${provider}:`, {
      issuerUrl: config.issuerUrl,
      discoveryUrl,
      serverUrl: serverUrl.toString(),
      nodeVersion: process.version,
    });

    // Test if discovery URL is reachable first (helps diagnose network issues)
    if (provider === "google") {
      try {
        // Use a simple timeout implementation that works in all Node.js versions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch(discoveryUrl, {
          method: "GET",
          headers: { "Accept": "application/json" },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!testResponse.ok) {
          console.warn(`[OAuth Discovery] Discovery URL returned status ${testResponse.status}`);
        } else {
          console.log(`[OAuth Discovery] Discovery URL is reachable (status ${testResponse.status})`);
        }
      } catch (testError) {
        const isAborted = testError instanceof Error && testError.name === 'AbortError';
        if (!isAborted) {
          console.warn(`[OAuth Discovery] Direct fetch test failed:`, {
            error: testError instanceof Error ? testError.message : String(testError),
            errorName: testError instanceof Error ? testError.name : undefined,
            discoveryUrl,
          });
        }
        // Continue anyway - openid-client might handle it differently
      }
    }

    // Use openid-client's discovery function
    const configuration = await client.discovery(
      serverUrl,
      clientId,
      undefined, // metadata (optional)
      client.ClientSecretPost(clientSecret) // clientAuthentication
    );

    console.log(`[OAuth Discovery] Successfully discovered ${provider} configuration`);
    configCache[provider] = configuration;
    return configuration;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCause = error instanceof Error && 'cause' in error ? error.cause : undefined;
    
    console.error(`[OAuth Discovery] Failed to discover ${provider} configuration:`, {
      error: errorMessage,
      errorStack,
      errorCause,
      issuerUrl: config.issuerUrl,
      discoveryUrl: `${config.issuerUrl}/.well-known/openid-configuration`,
      clientIdPrefix: clientId?.substring(0, 30) || "MISSING",
      hasClientSecret: !!clientSecret,
      nodeVersion: process.version,
    });

    // Provide more helpful error message
    if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND") || errorMessage.includes("network")) {
      throw new Error(
        `Network error connecting to ${provider} OAuth service. Check your internet connection, firewall settings, and DNS. If you're behind a proxy, configure Node.js to use it. Original error: ${errorMessage}`
      );
    }

    throw new Error(
      `Failed to discover ${provider} OAuth configuration: ${errorMessage}`
    );
  }
}

export async function getProviderConfiguration(
  provider: CalendarProvider,
  hostname?: string
): Promise<client.Configuration> {
  return getConfiguration(provider, hostname);
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
