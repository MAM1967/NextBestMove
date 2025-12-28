import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/ai/test-key
 * Test an OpenAI API key
 * Premium users only
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { apiKey, model = "gpt-4o-mini" } = body;

  if (!apiKey || !apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 400 }
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    
    // Make a minimal test call
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: "Test",
        },
      ],
      max_tokens: 5,
    });

    if (response.choices[0]?.message?.content) {
      return NextResponse.json({ success: true, message: "API key is valid" });
    }

    return NextResponse.json(
      { error: "Invalid response from API" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("OpenAI API test error:", error);
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to test API key" },
      { status: 500 }
    );
  }
}













