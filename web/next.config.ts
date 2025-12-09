import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { readFileSync } from "fs";
import { join } from "path";

// Read .env.local directly to bypass Next.js parsing issues
function readEnvLocal() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};

    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          // Remove any "export" suffix that might have been appended
          let value = valueParts.join("=").trim();
          if (value.endsWith("export")) {
            value = value.slice(0, -6);
          }
          env[key.trim()] = value;
        }
      }
    });

    return env;
  } catch (error) {
    console.warn("Could not read .env.local, using fallbacks");
    return {};
  }
}

const envLocal = readEnvLocal();

// Determine environment
const isProduction = process.env.VERCEL_ENV === "production";
const isPreview = process.env.VERCEL_ENV === "preview";

// Expected project IDs
const PRODUCTION_PROJECT_ID = "lilhqhbbougkblznspow";
const STAGING_PROJECT_ID = "adgiptzbxnzddbgfeuut";

// Determine what Supabase URL should be used (accounting for workaround)
const getExpectedSupabaseUrl = () => {
  if (!process.env.VERCEL) {
    // Local: use from env
    return envLocal.NEXT_PUBLIC_SUPABASE_URL || 
           process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") || 
           "";
  }
  
  // Vercel builds: workaround overrides based on VERCEL_ENV
  if (isPreview) {
    return "https://adgiptzbxnzddbgfeuut.supabase.co";
  } else if (isProduction) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") || "";
  }
  
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") || "";
};

const expectedSupabaseUrl = getExpectedSupabaseUrl();
const expectedProjectId = expectedSupabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "";

// Debug logging for Vercel builds
if (process.env.VERCEL) {
  console.log("🔍 Build Environment Debug:");
  console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || "undefined"}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_URL from process.env: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) || "undefined"}...`);
  console.log(`   Expected URL (after workaround): ${expectedSupabaseUrl.substring(0, 50) || "undefined"}...`);
  console.log(`   Expected project ID: ${expectedProjectId || "none"}`);
  console.log(`   isProduction: ${isProduction}`);
  console.log(`   isPreview: ${isPreview}`);
  
  if (isPreview && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(PRODUCTION_PROJECT_ID)) {
    console.log("⚠️  WARNING: Vercel provided Production URL for Preview build (known bug)");
    console.log("   Workaround: Overriding with staging URL in env config");
  }
}

// Note: We no longer fail the build here because we're using a workaround
// The workaround in the env section will ensure the correct values are used

const nextConfig: NextConfig = {
  /* config options here */
  // instrumentation.ts is automatically enabled in Next.js 16+
  // Read env vars directly from .env.local file to work around parsing issues
  
  // Remove X-Powered-By header
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Stricter Content Security Policy (without unsafe-eval/unsafe-inline for scripts)
          // Note: Using 'self' + 'strict-dynamic' allows Next.js chunks and dynamically loaded scripts
          // 'self' allows same-origin scripts (/_next/static/chunks/), 'strict-dynamic' allows scripts loaded by those
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'strict-dynamic' https://cloud.umami.is", // 'self' allows Next.js chunks, 'strict-dynamic' allows dynamically loaded scripts
              "style-src 'self' 'unsafe-inline'", // Next.js still needs this for CSS
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              // External API connections
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://billing.stripe.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://login.microsoftonline.com https://graph.microsoft.com https://api.resend.com https://app.glitchtip.com https://cloud.umami.is https://api-gateway.umami.dev",
              // Stripe checkout/billing portal iframes
              "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com https://js.stripe.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
          // Anti-clickjacking Protection
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection (legacy but harmless)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ],
      },
    ];
  },
  
  env: {
    // WORKAROUND: Vercel has a bug where Preview builds get Production env vars
    // Override based on VERCEL_ENV to ensure correct project is used
    NEXT_PUBLIC_SUPABASE_URL: (() => {
      // Local development: use .env.local or process.env
      if (!process.env.VERCEL) {
        return envLocal.NEXT_PUBLIC_SUPABASE_URL ||
               process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") ||
               undefined;
      }
      
      // Vercel builds: override based on VERCEL_ENV
      if (process.env.VERCEL_ENV === "preview") {
        // Preview/Staging: force staging project
        const stagingUrl = "https://adgiptzbxnzddbgfeuut.supabase.co";
        console.log("🔧 WORKAROUND: Overriding NEXT_PUBLIC_SUPABASE_URL for Preview build");
        console.log(`   Vercel provided: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50)}...`);
        console.log(`   Overriding with: ${stagingUrl}`);
        return stagingUrl;
      } else if (process.env.VERCEL_ENV === "production") {
        // Production: use production project
        return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") || undefined;
      }
      
      // Development or fallback
      return envLocal.NEXT_PUBLIC_SUPABASE_URL ||
             process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") ||
             undefined;
    })(),
    
    NEXT_PUBLIC_SUPABASE_ANON_KEY: (() => {
      // Local development: use .env.local or process.env
      if (!process.env.VERCEL) {
        return envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
               undefined;
      }
      
      // Vercel builds: override based on VERCEL_ENV
      if (process.env.VERCEL_ENV === "preview") {
        // Preview/Staging: force staging anon key
        const stagingAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ";
        console.log("🔧 WORKAROUND: Overriding NEXT_PUBLIC_SUPABASE_ANON_KEY for Preview build");
        return stagingAnonKey;
      } else if (process.env.VERCEL_ENV === "production") {
        // Production: use production anon key
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined;
      }
      
      // Development or fallback
      return envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
             undefined;
    })(),
    
    // Service role key for admin operations (server-side only)
    // WORKAROUND: Vercel Preview builds sometimes don't get env vars correctly
    // Override for Preview builds to ensure staging key is used
    SUPABASE_SERVICE_ROLE_KEY: (() => {
      // Local development: use .env.local or process.env
      if (!process.env.VERCEL) {
        return envLocal.SUPABASE_SERVICE_ROLE_KEY ||
               process.env.SUPABASE_SERVICE_ROLE_KEY ||
               undefined;
      }
      
      // Vercel builds: override based on VERCEL_ENV
      if (process.env.VERCEL_ENV === "preview") {
        // Preview/Staging: force staging service role key
        const stagingServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo";
        const vercelProvided = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (vercelProvided !== stagingServiceRoleKey) {
          console.log("🔧 WORKAROUND: Overriding SUPABASE_SERVICE_ROLE_KEY for Preview build");
          console.log(`   Vercel provided: ${vercelProvided ? `${vercelProvided.substring(0, 30)}... (length: ${vercelProvided.length})` : "MISSING"}`);
          console.log(`   Overriding with: ${stagingServiceRoleKey.substring(0, 30)}... (length: ${stagingServiceRoleKey.length})`);
        }
        return stagingServiceRoleKey;
      } else if (process.env.VERCEL_ENV === "production") {
        // Production: use production service role key
        return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
      }
      
      // Development or fallback
      return envLocal.SUPABASE_SERVICE_ROLE_KEY ||
             process.env.SUPABASE_SERVICE_ROLE_KEY ||
             undefined;
    })(),
  },
  // Ensure server-side environment variables are available
  // In Next.js, non-NEXT_PUBLIC_ vars are automatically server-only, but this ensures it's accessible
};

// Wrap with Sentry config (GlitchTip uses same SDK)
// Only wrap if DSN is configured
const glitchTipDsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

// For GlitchTip, we can use Sentry SDK without build-time integration
// The runtime SDK will work fine without withSentryConfig
// However, withSentryConfig provides source maps support
let finalConfig: NextConfig = nextConfig;

if (glitchTipDsn) {
  try {
    finalConfig = withSentryConfig(nextConfig, {
      // GlitchTip doesn't use org/project, but Sentry SDK requires them
      // Use dummy values - they won't be used
      org: "glitchtip",
      project: "nextbestmove",

      // Only upload source maps in production
      silent: process.env.NODE_ENV !== "production",

      // Source maps configuration
      sourcemaps: {
        assets: "./.next/**",
        ignore: ["node_modules"],
      },

      // Disable Sentry telemetry
      telemetry: false,

      // Don't fail build if source maps fail
      widenClientFileUpload: true,
    });
  } catch (error) {
    console.warn(
      "Failed to wrap with Sentry config, using basic config:",
      error
    );
    // Fall back to basic config if Sentry wrapping fails
    finalConfig = nextConfig;
  }
}

export default finalConfig;
