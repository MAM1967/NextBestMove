import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/unsubscribe?token=xxx
 * Unsubscribe endpoint for email links
 * Token is a signed JWT or hash that identifies the user
 * For now, we'll use a simple approach: email + timestamp hash
 * In production, use a proper signed token
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token && !email) {
    return NextResponse.json(
      { error: "Missing token or email" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // If email is provided, unsubscribe directly (for testing/simple cases)
  // In production, verify the token signature
  if (email) {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ email_unsubscribed: true })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error unsubscribing user:", updateError);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    // Return HTML success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h1 style="color: #111827;">You've been unsubscribed</h1>
          <p style="color: #6b7280; margin-top: 16px;">
            You won't receive any more emails from NextBestMove.
          </p>
          <p style="color: #6b7280; margin-top: 16px; font-size: 14px;">
            You can manage your email preferences in your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings">settings</a>.
          </p>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // TODO: Implement token verification for production
  return NextResponse.json(
    { error: "Token verification not yet implemented" },
    { status: 501 }
  );
}

