import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Debug endpoint to check Supabase configuration
 * Only accessible on staging
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Only allow on staging
  if (hostname !== "staging.nextbestmove.app" && !hostname.includes("vercel.app")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  // Check if this is staging Supabase
  const isStagingSupabase = supabaseUrl.includes("adgiptzbxnzddbgfeuut.supabase.co");
  
  // Try to create admin client
  let adminClient;
  let clientError = null;
  try {
    adminClient = createAdminClient();
  } catch (error: unknown) {
    clientError = error instanceof Error ? error.message : String(error);
  }
  
  // Try a simple query if client was created
  let queryError = null;
  let querySuccess = false;
  if (adminClient) {
    try {
      const { error } = await adminClient.from("users").select("id").limit(1);
      if (error) {
        queryError = error.message;
      } else {
        querySuccess = true;
      }
    } catch (error: unknown) {
      queryError = error instanceof Error ? error.message : String(error);
    }
  }
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 50)}...` : "MISSING",
    supabaseUrlFull: supabaseUrl || "MISSING",
    isStagingSupabase,
    hasServiceRoleKey: !!serviceRoleKey,
    serviceRoleKeyLength: serviceRoleKey.length,
    serviceRoleKeyPrefix: serviceRoleKey.substring(0, 30) || "MISSING",
    serviceRoleKeyStartsWithEyJ: serviceRoleKey.startsWith("eyJ"),
    serviceRoleKeyContainsStagingId: serviceRoleKey.includes("adgiptzbxnzddbgfeuut"),
    // Client creation
    clientCreated: !!adminClient,
    clientError,
    // Query test
    querySuccess,
    queryError,
  });
}

