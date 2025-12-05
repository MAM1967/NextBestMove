import { NextResponse } from "next/server";

// Test endpoint to verify Basic Auth is working
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Basic Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Test Basic Auth", charset="UTF-8"',
        "Content-Type": "text/plain",
      },
    });
  }

  // Decode credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(":");

  return NextResponse.json({
    success: true,
    message: "Basic Auth is working!",
    username,
    passwordLength: password.length,
  });
}

