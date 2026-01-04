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

export interface ProposedTier {
  tier: string;
  size: number;
}

export interface AttachmentInfo {
  filename: string;
  type: string;
  reason: string;
}

export interface LinkInfo {
  url: string;
  label: string;
}

export interface RelationshipSignal {
  signal_type: string;
  strength: "Low" | "Medium" | "High";
  evidence: string[];
}

export interface AISignals {
  // Legacy fields (kept for backward compatibility)
  topic: string;
  asks: string[];
  openLoops: string[];
  priority: "high" | "medium" | "low" | "normal";
  sentiment: Sentiment | null;
  intent: Intent | null;
  recommendedAction: RecommendedAction | null;
  
  // Enhanced comprehensive fields
  thread_summary_1l: string | null; // One-line summary
  thread_summary_detail: string | null; // Detailed summary
  primary_category: string | null;
  secondary_categories: string[] | null;
  topics: string[] | null; // Enhanced topics list
  proposed_tiers: ProposedTier[] | null;
  asks_from_sender: string[] | null; // Enhanced asks
  value_to_capture: string[] | null;
  suggested_next_actions: string[] | null;
  attachments: AttachmentInfo[] | null;
  links: LinkInfo[] | null;
  relationship_signal: RelationshipSignal | null;
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
      // Legacy fields
      topic: ruleBased.topic,
      asks: ruleBased.asks,
      openLoops: ruleBased.openLoops,
      priority: ruleBased.priority,
      sentiment: null,
      intent: null,
      recommendedAction: null,
      // Comprehensive fields (null when AI not available)
      thread_summary_1l: null,
      thread_summary_detail: null,
      primary_category: null,
      secondary_categories: null,
      topics: null,
      proposed_tiers: null,
      asks_from_sender: null,
      value_to_capture: null,
      suggested_next_actions: null,
      attachments: null,
      links: null,
      relationship_signal: null,
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
          content: `You are extracting CRM-style signals from an email for categorization and follow-up.

Return ONLY valid JSON.

Rules:
- Be specific. Capture intent, asks, and any concrete numbers.
- Include categories, topics, and suggested next actions.
- Extract any tier structures or frameworks verbatim into structured fields.
- Detect attachments and links (if present in the input).
- Do NOT restate the entire email. Summarize.

Output schema:
{
  "thread_summary_1l": string,
  "thread_summary_detail": string,
  "primary_category": string,
  "secondary_categories": string[],
  "topics": string[],
  "proposed_tiers": [{"tier": string, "size": number}] (optional),
  "asks_from_sender": string[],
  "value_to_capture": string[],
  "suggested_next_actions": string[],
  "attachments": [{"filename": string, "type": string, "reason": string}] (optional),
  "links": [{"url": string, "label": string}] (optional),
  "sentiment": "Positive" | "Neutral" | "Negative",
  "relationship_signal": {"signal_type": string, "strength": "Low"|"Medium"|"High", "evidence": string[]},
  "topic": string (legacy - one-line topic summary),
  "asks": string[] (legacy - same as asks_from_sender),
  "openLoops": string[] (legacy - unresolved items),
  "priority": "high" | "medium" | "low" | "normal",
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
          content: `EMAIL INPUT:
<<<
${truncatedEmail}
>>>`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000, // Increased for comprehensive output
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(content);

    // Validate and sanitize response
    const signals: AISignals = {
      // Legacy fields (for backward compatibility)
      topic: sanitizeString(parsed.topic, 100) || sanitizeString(parsed.thread_summary_1l, 100) || subject || "No topic",
      asks: sanitizeArray(parsed.asks || parsed.asks_from_sender, 5, 200),
      openLoops: sanitizeArray(parsed.openLoops, 5, 200),
      priority: validatePriority(parsed.priority),
      sentiment: validateSentiment(parsed.sentiment?.toLowerCase()),
      intent: validateIntent(parsed.intent),
      recommendedAction: validateRecommendedAction(parsed.recommendedAction),
      
      // Enhanced comprehensive fields
      thread_summary_1l: sanitizeString(parsed.thread_summary_1l, 200) || null,
      thread_summary_detail: sanitizeString(parsed.thread_summary_detail, 1000) || null,
      primary_category: sanitizeString(parsed.primary_category, 100) || null,
      secondary_categories: sanitizeArray(parsed.secondary_categories, 10, 100) || null,
      topics: sanitizeArray(parsed.topics, 10, 200) || null,
      proposed_tiers: validateProposedTiers(parsed.proposed_tiers),
      asks_from_sender: sanitizeArray(parsed.asks_from_sender, 10, 200) || null,
      value_to_capture: sanitizeArray(parsed.value_to_capture, 10, 200) || null,
      suggested_next_actions: sanitizeArray(parsed.suggested_next_actions, 10, 200) || null,
      attachments: validateAttachments(parsed.attachments),
      links: validateLinks(parsed.links),
      relationship_signal: validateRelationshipSignal(parsed.relationship_signal),
    };

    return signals;
  } catch (error) {
    console.error("[AI Signals] Error extracting signals with AI:", error);
    // Fallback to rule-based extraction
    const ruleBased = extractSignals(subject, snippet, importance);
    return {
      // Legacy fields
      topic: ruleBased.topic,
      asks: ruleBased.asks,
      openLoops: ruleBased.openLoops,
      priority: ruleBased.priority,
      sentiment: null,
      intent: null,
      recommendedAction: null,
      // Comprehensive fields (null when AI fails)
      thread_summary_1l: null,
      thread_summary_detail: null,
      primary_category: null,
      secondary_categories: null,
      topics: null,
      proposed_tiers: null,
      asks_from_sender: null,
      value_to_capture: null,
      suggested_next_actions: null,
      attachments: null,
      links: null,
      relationship_signal: null,
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

/**
 * Validate proposed tiers
 */
function validateProposedTiers(value: any): ProposedTier[] | null {
  if (!Array.isArray(value)) return null;
  
  return value
    .filter((item) => 
      item && 
      typeof item === "object" &&
      typeof item.tier === "string" &&
      typeof item.size === "number"
    )
    .map((item) => ({
      tier: String(item.tier).substring(0, 50),
      size: Math.max(0, Math.min(1000, Math.floor(item.size))),
    }))
    .slice(0, 20); // Limit to 20 tiers
}

/**
 * Validate attachments
 */
function validateAttachments(value: any): AttachmentInfo[] | null {
  if (!Array.isArray(value)) return null;
  
  return value
    .filter((item) => 
      item && 
      typeof item === "object" &&
      typeof item.filename === "string" &&
      typeof item.type === "string"
    )
    .map((item) => ({
      filename: String(item.filename).substring(0, 255),
      type: String(item.type).substring(0, 50),
      reason: typeof item.reason === "string" ? String(item.reason).substring(0, 200) : "",
    }))
    .slice(0, 20); // Limit to 20 attachments
}

/**
 * Validate links
 */
function validateLinks(value: any): LinkInfo[] | null {
  if (!Array.isArray(value)) return null;
  
  return value
    .filter((item) => 
      item && 
      typeof item === "object" &&
      typeof item.url === "string"
    )
    .map((item) => ({
      url: String(item.url).substring(0, 500),
      label: typeof item.label === "string" ? String(item.label).substring(0, 200) : "",
    }))
    .slice(0, 20); // Limit to 20 links
}

/**
 * Validate relationship signal
 */
function validateRelationshipSignal(value: any): RelationshipSignal | null {
  if (!value || typeof value !== "object") return null;
  
  const validStrengths = ["Low", "Medium", "High"];
  const strength = validStrengths.includes(value.strength) ? value.strength : "Medium";
  
  return {
    signal_type: typeof value.signal_type === "string" 
      ? String(value.signal_type).substring(0, 100) 
      : "General",
    strength: strength as "Low" | "Medium" | "High",
    evidence: sanitizeArray(value.evidence, 10, 200) || [],
  };
}

