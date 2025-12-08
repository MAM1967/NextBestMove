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
  // Don't use cache - we need to check and override secrets on every call
  // This ensures we always use the correct secret even if env vars change
  // if (configCache[provider]) {
  //   return configCache[provider]!;
  // }

  const config = PROVIDERS[provider];

  // WORKAROUND: Vercel sometimes doesn't pass env vars correctly to runtime
  // Override based on VERCEL_ENV to ensure correct OAuth client IDs are used
  let clientId = process.env[config.clientIdEnv]?.trim();
  let clientSecret = process.env[config.clientSecretEnv]?.trim();

  // Detect environment FIRST - needed for immediate override checks
  const vercelEnv = process.env.VERCEL_ENV;
  let isPreview = vercelEnv === "preview";
  let isProduction = vercelEnv === "production";
  let isLocalhost = false;

  // Hostname-based detection (always check as verification/fallback)
  if (hostname) {
    if (hostname === "nextbestmove.app") {
      isProduction = true;
      isPreview = false;
    } else if (
      hostname === "staging.nextbestmove.app" ||
      hostname.includes("vercel.app")
    ) {
      isPreview = true;
      isProduction = false;
    } else if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("localhost:") ||
      hostname.startsWith("127.0.0.1:")
    ) {
      // Local development - use staging client (both staging and production have localhost configured)
      isLocalhost = true;
      isPreview = true; // Treat localhost as preview/staging for OAuth
      isProduction = false;
    }
  }

  // CRITICAL FIX: In production, ALWAYS override if we detect staging credentials or deleted client IDs
  // This must happen BEFORE any other logic to ensure correct credentials from the start
  if (provider === "google" && isProduction) {
    const hasStagingClientId = clientId?.startsWith("732850218816-kgrh");
    const hasDeletedClientId = clientId?.includes("6b8ft52uum9dh2m18uk86jo4o8dk96cm"); // Deleted client ID
    // Staging secret starts with GOCSPX-U9 (current) or GOCSPX-3zD (old/alternative)
    const hasStagingSecret = clientSecret?.startsWith("GOCSPX-U9") || clientSecret?.startsWith("GOCSPX-3zD");
    
    if (hasStagingClientId || hasDeletedClientId || hasStagingSecret) {
      console.log("🚨 CRITICAL: Production environment detected but incorrect credentials found!");
      console.log(`   Client ID: ${clientId?.substring(0, 30) || "MISSING"}...`);
      console.log(`   Secret prefix: ${clientSecret?.substring(0, 10) || "MISSING"}...`);
      
      // Override client ID if staging or deleted
      if (hasStagingClientId || hasDeletedClientId) {
        const productionClientId = "732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com";
        console.log(`   🔧 FORCING production client ID: ${productionClientId.substring(0, 30)}...`);
        if (hasDeletedClientId) {
          console.log(`   ⚠️  Detected deleted client ID - replacing with production client ID`);
        }
        clientId = productionClientId;
      }
      
      // Override secret if staging
      if (hasStagingSecret) {
        const hardcodedProductionSecret = "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";
        console.log(`   🔧 FORCING production secret: ${hardcodedProductionSecret.substring(0, 10)}...`);
        clientSecret = hardcodedProductionSecret;
      }
    }
  }
  
  // Also check for deleted client ID in preview/staging (shouldn't happen, but safety check)
  if (provider === "google" && isPreview) {
    const hasDeletedClientId = clientId?.includes("6b8ft52uum9dh2m18uk86jo4o8dk96cm");
    if (hasDeletedClientId) {
      console.log("🚨 CRITICAL: Preview environment detected but deleted client ID found!");
      const stagingClientId = "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
      console.log(`   🔧 FORCING staging client ID: ${stagingClientId.substring(0, 30)}...`);
      clientId = stagingClientId;
    }
  }
  
  // Also check for deleted client ID even if environment isn't clearly detected (safety net)
  if (provider === "google") {
    const hasDeletedClientId = clientId?.includes("6b8ft52uum9dh2m18uk86jo4o8dk96cm");
    if (hasDeletedClientId) {
      console.log("🚨 CRITICAL: Deleted client ID detected - attempting to determine correct client ID");
      
      // Use hostname to determine which client ID to use
      if (hostname && hostname === "nextbestmove.app") {
        const productionClientId = "732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com";
        console.log(`   🔧 Using production client ID based on hostname: ${productionClientId.substring(0, 30)}...`);
        clientId = productionClientId;
      } else if (hostname && (hostname === "staging.nextbestmove.app" || hostname.includes("vercel.app"))) {
        const stagingClientId = "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
        console.log(`   🔧 Using staging client ID based on hostname: ${stagingClientId.substring(0, 30)}...`);
        clientId = stagingClientId;
      } else if (isLocalhost) {
        // For localhost, use staging client (both staging and production have localhost redirect URIs)
        const stagingClientId = "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
        console.log(`   🔧 Using staging client ID for localhost: ${stagingClientId.substring(0, 30)}...`);
        clientId = stagingClientId;
      } else {
        // Default to production if we can't determine
        const productionClientId = "732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com";
        console.log(`   🔧 Using production client ID as default: ${productionClientId.substring(0, 30)}...`);
        clientId = productionClientId;
      }
    }
  }
  
  // For localhost development, ensure we use staging client and secret
  if (provider === "google" && isLocalhost) {
    const stagingClientId = "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
    const hardcodedStagingSecret = "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";
    const stagingSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Override to staging client for localhost (always override deleted client ID)
    const hasDeletedClientId = clientId?.includes("6b8ft52uum9dh2m18uk86jo4o8dk96cm");
    if (hasDeletedClientId || !clientId || !clientId.startsWith("732850218816-kgrh")) {
      console.log(`🔧 Localhost detected - using staging client ID for local development`);
      if (hasDeletedClientId) {
        console.log(`   ⚠️  Detected deleted client ID in .env.local - overriding with staging client ID`);
      }
      clientId = stagingClientId;
    }
    
    // Use staging secret for localhost
    // Check if the provided secret is already the correct staging secret
    const isCorrectStagingSecret = stagingSecret && (
      stagingSecret.startsWith("GOCSPX-U9") || 
      stagingSecret.startsWith("GOCSPX-3zD") ||
      stagingSecret === hardcodedStagingSecret
    );
    
    if (isCorrectStagingSecret) {
      clientSecret = stagingSecret;
      console.log(`🔧 Localhost detected - using staging client secret from .env.local`);
    } else {
      // Override with hardcoded staging secret if .env.local has wrong secret or no secret
      console.warn(`⚠️  Localhost detected but GOOGLE_CLIENT_SECRET doesn't match staging secret pattern`);
      console.log(`   🔧 FORCING staging client secret for localhost development`);
      console.log(`   Env var secret: ${stagingSecret ? `${stagingSecret.substring(0, 10)}...` : "MISSING"}`);
      clientSecret = hardcodedStagingSecret;
      console.log(`   Using hardcoded staging secret: ${hardcodedStagingSecret.substring(0, 10)}...`);
    }
  }

  // Log environment detection for debugging
  if (provider === "google") {
    console.log(`[OAuth Config] Environment detection:`, {
      vercelEnv: vercelEnv || "NOT_SET",
      hostname: hostname || "NOT_PROVIDED",
      isProduction,
      isPreview,
      clientIdPrefix: clientId?.substring(0, 30) || "MISSING",
      clientSecretPrefix: clientSecret?.substring(0, 10) || "MISSING",
    });
  }

  if (provider === "google") {
    if (isPreview) {
      // Staging: Use NextBestMove-Test client
      const stagingClientId =
        "732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com";
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
    }
    
    // CRITICAL: Always check for production environment (even if not explicitly detected)
    // If we have production client ID or production hostname, ensure we use production secret
    const hasProductionClientId = clientId?.startsWith("732850218816-5een");
    const isProductionHostname = hostname === "nextbestmove.app";
    const shouldUseProduction = isProduction || hasProductionClientId || isProductionHostname;
    
    // CRITICAL FIX: If production client ID detected, ALWAYS ensure production secret
    // This handles the case where VERCEL_ENV might not be set correctly
    const hasStagingSecretWithProductionClient = clientSecret && (
      clientSecret.startsWith("GOCSPX-U9") || 
      clientSecret.startsWith("GOCSPX-U9") || clientSecret.startsWith("GOCSPX-3zD")
    );
    if (hasProductionClientId && hasStagingSecretWithProductionClient) {
      console.log(
        "🔧 CRITICAL: Production client ID detected but staging secret present - FORCING override"
      );
      const hardcodedProductionSecret = "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";
      clientSecret = hardcodedProductionSecret;
      console.log(
        `   Overriding staging secret with production secret: ${hardcodedProductionSecret.substring(0, 10)}...`
      );
    }
    
    if (shouldUseProduction) {
      console.log(`[OAuth Config] Production mode detected:`, {
        isProduction,
        hasProductionClientId,
        isProductionHostname,
        hostname,
      });
      
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

      // WORKAROUND: Vercel is providing staging client secret in production
      // Always check and override if staging secret is detected in production
      const vercelProvidedSecret = clientSecret;

      // Override if Vercel provided staging secret (starts with GOCSPX-U9 or GOCSPX-3zD)
      // This MUST happen in production - staging secret won't work with production client ID
      const isStagingSecretPrefix = vercelProvidedSecret && (
        vercelProvidedSecret.startsWith("GOCSPX-U9") || 
        vercelProvidedSecret.startsWith("GOCSPX-U9") || vercelProvidedSecret.startsWith("GOCSPX-3zD")
      );
      if (isStagingSecretPrefix) {
        // Staging secret detected - use production-specific env var if available
        if (process.env.PRODUCTION_GOOGLE_CLIENT_SECRET) {
          console.log(
            "🔧 WORKAROUND: Overriding GOOGLE_CLIENT_SECRET for Production build"
          );
          console.log(
            `   Vercel provided (staging): ${vercelProvidedSecret.substring(
              0,
              10
            )}... (length: ${vercelProvidedSecret.length})`
          );
          console.log(
            `   Using PRODUCTION_GOOGLE_CLIENT_SECRET env var instead`
          );
          clientSecret = process.env.PRODUCTION_GOOGLE_CLIENT_SECRET.trim();
        } else {
          // WORKAROUND: Vercel env var bug - PRODUCTION_GOOGLE_CLIENT_SECRET not available at runtime
          // Hardcode production client secret (same pattern as client ID workaround)
          // Get this from Google Cloud Console → NextBestMove client → Client secret
          const hardcodedProductionSecret =
            "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";

          console.log(
            "🔧 WORKAROUND: Vercel not providing PRODUCTION_GOOGLE_CLIENT_SECRET, using hardcoded value"
          );
          console.log(
            `   Vercel provided (staging): ${vercelProvidedSecret.substring(
              0,
              10
            )}... (length: ${vercelProvidedSecret.length})`
          );
          console.log(
            `   Using hardcoded production secret: ${hardcodedProductionSecret.substring(
              0,
              10
            )}... (length: ${hardcodedProductionSecret.length})`
          );

          clientSecret = hardcodedProductionSecret;
        }
      }
      
      // CRITICAL SAFETY CHECK: If production mode but still have staging secret, ALWAYS override
      // This handles edge cases where detection didn't work properly
      const hasStagingSecretInProductionContext = clientSecret && (
        clientSecret.startsWith("GOCSPX-U9") || 
        clientSecret.startsWith("GOCSPX-3zD")
      );
      if (hasStagingSecretInProductionContext) {
        console.log(
          "⚠️ CRITICAL: Staging secret detected in production context, forcing override"
        );
        const hardcodedProductionSecret =
          "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";
        clientSecret = hardcodedProductionSecret;
        console.log(
          `   Overriding with hardcoded production secret: ${hardcodedProductionSecret.substring(
            0,
            10
          )}...`
        );
      }
    } else if (hasProductionClientId) {
      // Edge case: Production client ID detected but not in production block
      // This should never happen, but be defensive
      console.log(
        "⚠️ WARNING: Production client ID detected but not in production block"
      );
      const hasStagingSecretEdgeCase = clientSecret && (
        clientSecret.startsWith("GOCSPX-U9") || 
        clientSecret.startsWith("GOCSPX-3zD")
      );
      if (hasStagingSecretEdgeCase) {
        console.log(
          "🔧 FORCING: Overriding staging secret to match production client ID"
        );
        const hardcodedProductionSecret =
          "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";
        clientSecret = hardcodedProductionSecret;
      }
    }
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
      isProductionSecret: clientSecret.startsWith("GOCSPX-UDm"),
      isStagingSecret: clientSecret.startsWith("GOCSPX-U9") || clientSecret.startsWith("GOCSPX-3zD"),
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
