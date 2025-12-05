import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Basic Auth protection for staging environment
  // Skip Basic Auth for API routes (webhooks, cron jobs need to work)
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isStaging = 
    process.env.VERCEL_ENV === "preview" ||
    request.nextUrl.hostname === "staging.nextbestmove.app" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";

  if (isStaging && !isApiRoute) {
    const stagingUser = process.env.STAGING_USER;
    const stagingPass = process.env.STAGING_PASS;

    // Only enforce Basic Auth if credentials are configured
    if (stagingUser && stagingPass) {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Basic ")) {
        return new NextResponse("Authentication required", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Staging Environment"',
          },
        });
      }

      // Decode Basic Auth credentials (using atob for Edge runtime compatibility)
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(":");

      // Verify credentials
      if (username !== stagingUser || password !== stagingPass) {
        return new NextResponse("Invalid credentials", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Staging Environment"',
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


