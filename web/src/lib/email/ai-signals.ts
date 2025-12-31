/**
 * AI-powered email signal extraction
 * Uses OpenAI GPT-4o-mini to extract signals from full email body
 * Falls back to rule-based extraction if AI fails
 */

import { getOpenAIClientForUser } from "@/lib/ai/openai";
import { extractSignals } from "./signals";
import { htmlToText } from "./html-to-text";

export type Sentiment = "positive" | "neutral" | "negative" | "urgent";
export type Intent =
  | "question"
  | "request"
  | "follow_up"
  | "introduction"
  | "meeting_request"
  | "proposal"
  | "complaint"
  | "other";

export type ActionType =
  | "OUTREACH"
  | "FOLLOW_UP"
  | "NURTURE"
  | "CALL_PREP"
  | "POST_CALL"
  | "CONTENT"
  | "FAST_WIN";

export interface RecommendedAction {
  action_type: ActionType | null;
  description: string | null;
  due_date_days: number | null; // Days from now (e.g., 2 = 2 days from today)
}

export interface AISignals {
  topic: string;
  asks: string[];
  openLoops: string[];
  priority: "high" | "medium" | "low" | "normal";
  sentiment: Sentiment | null;
  intent: Intent | null;
  recommendedAction: RecommendedAction | null;
}

/**
 * Extract signals from email using AI
 * Falls back to rule-based extraction if AI fails
 */
export async function extractSignalsWithAI(
  subject: string,
  snippet: string,
  fullBody: string,
  importance?: string,
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null,
  userModel?: string | null
): Promise<AISignals> {
  const client = getOpenAIClientForUser(userAiProvider, userApiKeyEncrypted);
  if (!client) {
    // No AI available, fallback to rule-based
    const ruleBased = extractSignals(subject, snippet, importance);
    return {
      topic: ruleBased.topic,
      asks: ruleBased.asks,
      openLoops: ruleBased.openLoops,
      priority: ruleBased.priority,
      sentiment: null,
      intent: null,
      recommendedAction: null,
    };
  }

  try {
    // Convert HTML to plain text if needed
    const cleanBody = htmlToText(fullBody || snippet);
    const emailText = `${subject}\n\n${cleanBody}`.trim();

    // Limit email text to avoid token limits (keep first 4000 chars)
    const truncatedEmail = emailText.substring(0, 4000);

    const model = userModel || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing business emails to extract key signals for relationship management and recommend follow-up actions.

Extract the following from the email:
1. **Topic**: Main subject/topic (1-2 sentences, max 100 chars)
2. **Asks**: Direct questions or requests (array of strings, max 5)
3. **Open Loops**: Unresolved action items or commitments (array of strings, max 5)
4. **Priority**: high, medium, low, or normal
5. **Sentiment**: positive, neutral, negative, or urgent
6. **Intent**: question, request, follow_up, introduction, meeting_request, proposal, complaint, or other
7. **Recommended Action**: Based on email content, attachments mentioned, asks, and open loops, recommend:
   - **action_type**: One of: OUTREACH, FOLLOW_UP, NURTURE, CALL_PREP, POST_CALL, CONTENT, FAST_WIN, or null if no action needed
   - **description**: Specific action description (e.g., "Follow up with sender on topic X", "Review attachment and provide feedback", "Schedule meeting to discuss proposal")
   - **due_date_days**: Number of days from now for due date (e.g., 2 = 2 days from today, null if no urgency)

Action type guidelines:
- FOLLOW_UP: Email requires a response or follow-up (questions, requests, open loops)
- OUTREACH: New conversation starter or introduction
- NURTURE: Soft touch, relationship building (no urgent CTA)
- CALL_PREP: Email mentions upcoming call/meeting
- POST_CALL: Email is after a call (recap, next steps)
- CONTENT: Email suggests content creation opportunity
- FAST_WIN: Quick action (<5 min) that moves relationship forward

Return ONLY valid JSON in this exact format:
{
  "topic": "string",
  "asks": ["string"],
  "openLoops": ["string"],
  "priority": "high" | "medium" | "low" | "normal",
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "intent": "question" | "request" | "follow_up" | "introduction" | "meeting_request" | "proposal" | "complaint" | "other",
  "recommendedAction": {
    "action_type": "OUTREACH" | "FOLLOW_UP" | "NURTURE" | "CALL_PREP" | "POST_CALL" | "CONTENT" | "FAST_WIN" | null,
    "description": "string" | null,
    "due_date_days": number | null
  }
}`,
        },
        {
          role: "user",
          content: `Analyze this email:\n\n${truncatedEmail}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(content);

    // Validate and sanitize response
    const signals: AISignals = {
      topic: sanitizeString(parsed.topic, 100) || subject || "No topic",
      asks: sanitizeArray(parsed.asks, 5, 200),
      openLoops: sanitizeArray(parsed.openLoops, 5, 200),
      priority: validatePriority(parsed.priority),
      sentiment: validateSentiment(parsed.sentiment),
      intent: validateIntent(parsed.intent),
      recommendedAction: validateRecommendedAction(parsed.recommendedAction),
    };

    return signals;
  } catch (error) {
    console.error("[AI Signals] Error extracting signals with AI:", error);
    // Fallback to rule-based extraction
    const ruleBased = extractSignals(subject, snippet, importance);
    return {
      topic: ruleBased.topic,
      asks: ruleBased.asks,
      openLoops: ruleBased.openLoops,
      priority: ruleBased.priority,
      sentiment: null,
      intent: null,
      recommendedAction: null,
    };
  }
}

/**
 * Sanitize string value
 */
function sanitizeString(value: any, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().substring(0, maxLength);
}

/**
 * Sanitize array of strings
 */
function sanitizeArray(
  value: any,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().substring(0, maxItemLength))
    .slice(0, maxItems);
}

/**
 * Validate priority value
 */
function validatePriority(value: any): "high" | "medium" | "low" | "normal" {
  const valid = ["high", "medium", "low", "normal"];
  return valid.includes(value) ? value : "normal";
}

/**
 * Validate sentiment value
 */
function validateSentiment(value: any): Sentiment | null {
  const valid: Sentiment[] = ["positive", "neutral", "negative", "urgent"];
  return valid.includes(value) ? value : null;
}

/**
 * Validate intent value
 */
function validateIntent(value: any): Intent | null {
  const valid: Intent[] = [
    "question",
    "request",
    "follow_up",
    "introduction",
    "meeting_request",
    "proposal",
    "complaint",
    "other",
  ];
  return valid.includes(value) ? value : null;
}

/**
 * Validate recommended action
 */
function validateRecommendedAction(value: any): RecommendedAction | null {
  if (!value || typeof value !== "object") return null;

  const validActionTypes: ActionType[] = [
    "OUTREACH",
    "FOLLOW_UP",
    "NURTURE",
    "CALL_PREP",
    "POST_CALL",
    "CONTENT",
    "FAST_WIN",
  ];

  const actionType = validActionTypes.includes(value.action_type)
    ? value.action_type
    : null;

  if (!actionType) return null;

  return {
    action_type: actionType,
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim().substring(0, 500)
        : null,
    due_date_days:
      typeof value.due_date_days === "number" && value.due_date_days >= 0
        ? value.due_date_days
        : null,
  };
}

