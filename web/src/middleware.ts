import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Basic Auth protection for staging environment
  // Skip Basic Auth for API routes (webhooks, cron jobs need to work)
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const hostname = request.nextUrl.hostname;
  const vercelEnv = process.env.VERCEL_ENV;
  
  // Check if staging - prioritize hostname check (most reliable)
  const isStaging = 
    hostname === "staging.nextbestmove.app" ||
    hostname?.endsWith(".vercel.app") && vercelEnv === "preview" ||
    vercelEnv === "preview" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";

  // Debug logging for staging (always log in staging to debug)
  if (isStaging) {
    console.log("[Middleware] Staging check:", {
      hostname,
      vercelEnv,
      isStaging,
      isApiRoute,
      pathname: request.nextUrl.pathname,
      hasStagingUser: !!process.env.STAGING_USER,
      hasStagingPass: !!process.env.STAGING_PASS,
      hasAuthHeader: !!request.headers.get("authorization"),
    });
  }

  if (isStaging && !isApiRoute) {
    // Trim whitespace from environment variables (Vercel sometimes adds trailing spaces)
    const stagingUser = process.env.STAGING_USER?.trim();
    const stagingPass = process.env.STAGING_PASS?.trim();

    // Only enforce Basic Auth if credentials are configured
    if (stagingUser && stagingPass) {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Basic ")) {
        // Return 401 with proper Basic Auth header to trigger browser prompt
        return new NextResponse("Authentication required", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Staging Environment", charset="UTF-8"',
            "Content-Type": "text/plain",
          },
        });
      }

      // Decode Basic Auth credentials (using atob for Edge runtime compatibility)
      const base64Credentials = authHeader.split(" ")[1];
      let credentials: string;
      try {
        credentials = atob(base64Credentials);
      } catch (e) {
        console.error("[Middleware] Failed to decode Base64:", e);
        return new NextResponse("Invalid authentication format", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Staging Environment", charset="UTF-8"',
            "Content-Type": "text/plain",
          },
        });
      }

      const [username, password] = credentials.split(":");

      // Trim credentials from user input (in case of whitespace)
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      // Debug logging for credential mismatch (only log lengths and first chars, not actual values)
      if (trimmedUsername !== stagingUser || trimmedPassword !== stagingPass) {
        console.log("[Middleware] Basic Auth failed:", {
          usernameMatch: trimmedUsername === stagingUser,
          passwordMatch: trimmedPassword === stagingPass,
          expectedUserLength: stagingUser.length,
          providedUserLength: trimmedUsername.length,
          expectedPassLength: stagingPass.length,
          providedPassLength: trimmedPassword.length,
          expectedUserFirstChar: stagingUser[0],
          providedUserFirstChar: trimmedUsername[0],
          expectedPassFirstChar: stagingPass[0],
          providedPassFirstChar: trimmedPassword[0],
          // Check for encoding issues
          expectedPassCharCodes: Array.from(stagingPass).slice(0, 3).map(c => c.charCodeAt(0)),
          providedPassCharCodes: Array.from(trimmedPassword).slice(0, 3).map(c => c.charCodeAt(0)),
        });
      }

      // Verify credentials (with trimming)
      if (trimmedUsername !== stagingUser || trimmedPassword !== stagingPass) {
        // Return 401 with proper Basic Auth header to trigger browser prompt
        return new NextResponse("Invalid credentials", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Staging Environment", charset="UTF-8"',
            "Content-Type": "text/plain",
          },
        });
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  // Protect /app routes - redirect to sign-in if not authenticated
  if (request.nextUrl.pathname.startsWith("/app")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  // Exception: allow /auth/reset-password when user has a recovery session
  if (request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/auth/reset-password") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


