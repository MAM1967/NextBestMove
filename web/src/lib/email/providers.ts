import * as client from "openid-client";

export type EmailProvider = "gmail" | "outlook";

type EmailProviderConfig = {
  issuerUrl: string;
  scope: string;
  extraAuthParams?: Record<string, string>;
  clientIdEnv: string;
  clientSecretEnv: string;
  tenantIdEnv?: string;
};

const EMAIL_PROVIDERS: Record<EmailProvider, EmailProviderConfig> = {
  gmail: {
    issuerUrl: "https://accounts.google.com",
    scope: "openid email https://www.googleapis.com/auth/gmail.readonly",
    extraAuthParams: {
      access_type: "offline",
      prompt: "select_account consent",
    },
    clientIdEnv: "GMAIL_CLIENT_ID",
    clientSecretEnv: "GMAIL_CLIENT_SECRET",
  },
  outlook: {
    issuerUrl: "https://login.microsoftonline.com/common/v2.0",
    scope: "openid email https://graph.microsoft.com/Mail.Read offline_access",
    clientIdEnv: "OUTLOOK_EMAIL_CLIENT_ID",
    clientSecretEnv: "OUTLOOK_EMAIL_CLIENT_SECRET",
    tenantIdEnv: "OUTLOOK_EMAIL_TENANT_ID",
  },
};

const configCache: Partial<Record<EmailProvider, client.Configuration>> = {};

export function isSupportedEmailProvider(value: string): value is EmailProvider {
  return value === "gmail" || value === "outlook";
}

export async function getEmailProviderConfiguration(
  provider: EmailProvider,
  hostname?: string
): Promise<client.Configuration> {
  // Use cache to avoid repeated discovery calls
  if (configCache[provider]) {
    return configCache[provider]!;
  }

  const config = EMAIL_PROVIDERS[provider];

  // Get credentials from environment variables
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();
  const tenantId = config.tenantIdEnv
    ? process.env[config.tenantIdEnv]?.trim()
    : undefined;

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv}/${config.clientSecretEnv} env vars are required for ${provider}`
    );
  }

  // Build issuer URL with tenant ID for Outlook
  let issuerUrl = config.issuerUrl;
  if (provider === "outlook" && tenantId) {
    issuerUrl = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  }

  try {
    // Use client.discovery for consistency with calendar implementation
    const serverUrl = new URL(issuerUrl);
    const configuration = await client.discovery(
      serverUrl,
      clientId,
      undefined, // metadata (optional)
      client.ClientSecretPost(clientSecret) // clientAuthentication
    );

    console.log(`[Email OAuth Discovery] Successfully discovered ${provider} configuration`);
    configCache[provider] = configuration;
    return configuration;
  } catch (error) {
    console.error(`[Email OAuth Discovery] Failed to discover ${provider} configuration:`, error);
    throw error;
  }
}

// PKCE helpers (re-exported from openid-client)
export const randomPKCECodeVerifier = client.randomPKCECodeVerifier;
export const calculatePKCECodeChallenge = client.calculatePKCECodeChallenge;
export const randomState = client.randomState;

export function getEmailProviderScope(provider: EmailProvider): string {
  return EMAIL_PROVIDERS[provider].scope;
}

export function buildEmailAuthParams(provider: EmailProvider): Record<string, string> {
  const config = EMAIL_PROVIDERS[provider];
  return config.extraAuthParams || {};
}

export function getEmailProviderClientMetadata(
  provider: EmailProvider,
  hostname?: string
): { client_id: string; client_secret: string } {
  const config = EMAIL_PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv}/${config.clientSecretEnv} env vars are required for ${provider}`
    );
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
  };
}

