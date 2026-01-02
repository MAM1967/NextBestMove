import { NextResponse } from "next/server";
import { extractSignalsWithAI } from "@/lib/email/ai-signals";
import { htmlToText } from "@/lib/email/html-to-text";

/**
 * Test AI extraction with the actual email body from Sarah L.
 * POST /api/debug/test-ai-extraction
 */
export async function POST(request: Request) {
  try {
    // The actual email body you provided
    const actualEmailBody = `Hi,
Great to catch up and see NextBestMove today! Here's the Spiral system I came up with that I mentioned. (see attached) Also, here 's the link to info about Dunbar's Number which is about 150 people. That's the max most people can maintain a stable relationship with. https://en.wikipedia.org/wiki/Dunbar%27s_number  I also attached the fibonacci numbers spiral that I based the tiers on. I started at 5 instead of 1 and skipped 1, 2 and 3. It adds up to 134 people.

So the tiers look like this:

S = 5 people
P= 8 people
I = 13 people
R = 21 people
A = 34 people
L = 55 people

One thing I thought about that would be nice is to be able to easily move people (drag and drop) between tiers as relationships shift. I am definitely interested in trying out NextBestMove so let me know when you're ready.
Happy Holidays!
-Rosie

Rosie Hausler
CEO
Digital Clues Group
425.301.6740
Schedule a Marketing Assessment`;

    const subject = "Spiral network model";
    const snippet = "Hi, Great to catch up and see NextBestMove today! Here's the Spiral system I came up with that I mentioned. (see attached) Also, here 's the link to info about Dunbar's Number which is";

    // Test with the actual full body
    const fullBodyText = htmlToText(actualEmailBody);
    
    // Run AI extraction
    let aiExtraction: any = null;
    let extractionError: string | null = null;
    
    try {
      // Use system AI (no user-specific settings needed for testing)
      aiExtraction = await extractSignalsWithAI(
        subject,
        snippet,
        fullBodyText,
        undefined,
        null, // Use system AI
        null,
        null
      );
    } catch (error) {
      extractionError = error instanceof Error ? error.message : "Unknown error";
      console.error("[Debug] AI extraction error:", error);
    }

    return NextResponse.json({
      input: {
        subject,
        snippet,
        fullBodyLength: actualEmailBody.length,
        fullBodyTextLength: fullBodyText.length,
        fullBodyPreview: fullBodyText.substring(0, 300) + "...",
      },
      aiExtraction: aiExtraction ? {
        // Legacy fields
        topic: aiExtraction.topic,
        asks: aiExtraction.asks,
        openLoops: aiExtraction.openLoops,
        priority: aiExtraction.priority,
        sentiment: aiExtraction.sentiment,
        intent: aiExtraction.intent,
        recommendedAction: aiExtraction.recommendedAction,
        // Comprehensive fields
        thread_summary_1l: aiExtraction.thread_summary_1l,
        thread_summary_detail: aiExtraction.thread_summary_detail,
        primary_category: aiExtraction.primary_category,
        secondary_categories: aiExtraction.secondary_categories,
        topics: aiExtraction.topics,
        proposed_tiers: aiExtraction.proposed_tiers,
        asks_from_sender: aiExtraction.asks_from_sender,
        value_to_capture: aiExtraction.value_to_capture,
        suggested_next_actions: aiExtraction.suggested_next_actions,
        attachments: aiExtraction.attachments,
        links: aiExtraction.links,
        relationship_signal: aiExtraction.relationship_signal,
      } : null,
      extractionError,
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to test AI extraction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

