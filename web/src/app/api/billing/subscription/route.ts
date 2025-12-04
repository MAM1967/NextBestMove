import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSubscriptionInfo } from "@/lib/billing/subscription";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionInfo = await getSubscriptionInfo(user.id);

    return NextResponse.json(subscriptionInfo);
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}







