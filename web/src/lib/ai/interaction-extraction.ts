import { getOpenAIClientForUser } from "./openai";

/**
 * Action type enum matching the database
 */
export type ActionType = 
  | "OUTREACH"
  | "FOLLOW_UP"
  | "NURTURE"
  | "CALL_PREP"
  | "POST_CALL"
  | "CONTENT"
  | "FAST_WIN";

/**
 * Extracted action item from meeting notes
 */
export interface ExtractedActionItem {
  description: string;
  action_type: ActionType;
  due_date?: string; // ISO date string, optional
  notes?: string; // Additional context
  confidence: "high" | "medium" | "low";
}

/**
 * Extracted insight from meeting notes
 */
export interface ExtractedInsight {
  text: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Result of interaction extraction
 */
export interface ExtractionResult {
  actionItems: ExtractedActionItem[];
  insights: ExtractedInsight[];
  overallConfidence: "high" | "medium" | "low";
  needsReview: boolean; // true if confidence is low or extraction had issues
}

/**
 * Extract structured action items and insights from meeting notes/transcript
 * 
 * Uses OpenAI to parse meeting notes and extract:
 * - Action items (with type, description, due date)
 * - Key insights (important points, decisions, opportunities)
 * 
 * Returns structured data that can be persisted to the database.
 */
export async function extractInteractions(
  meetingNotes: string,
  relationshipName: string,
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null,
  userModel?: string | null
): Promise<ExtractionResult> {
  const client = getOpenAIClientForUser(userAiProvider, userApiKeyEncrypted);
  
  if (!client) {
    // If no AI client available, return empty result with low confidence
    return {
      actionItems: [],
      insights: [],
      overallConfidence: "low",
      needsReview: true,
    };
  }

  try {
    const prompt = buildExtractionPrompt(meetingNotes, relationshipName);
    const model = userModel || "gpt-4o-mini";
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an assistant that extracts structured information from meeting notes and transcripts.
Your task is to identify:
1. Action items (tasks that need to be completed, with who should do them)
2. Key insights (important decisions, opportunities, concerns, or context)

For action items, classify them as:
- POST_CALL: Immediate follow-ups after a call (e.g., "Send meeting notes", "Schedule next call")
- FOLLOW_UP: General follow-ups (e.g., "Check in next week", "Send proposal")
- OUTREACH: Initial outreach (usually not in meeting notes, but include if mentioned)
- NURTURE: Relationship-building actions (e.g., "Send article", "Connect on LinkedIn")
- CONTENT: Content-related actions (e.g., "Write blog post", "Create case study")

Return your response as a JSON object with this structure:
{
  "actionItems": [
    {
      "description": "Clear, actionable description",
      "action_type": "POST_CALL" | "FOLLOW_UP" | "NURTURE" | "CONTENT",
      "due_date": "YYYY-MM-DD" (optional, only if explicitly mentioned or implied),
      "notes": "Additional context" (optional),
      "confidence": "high" | "medium" | "low"
    }
  ],
  "insights": [
    {
      "text": "Key insight or important point",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "overallConfidence": "high" | "medium" | "low"
}

Be conservative with confidence ratings:
- "high": Clear, explicit action item or insight
- "medium": Implied or somewhat ambiguous
- "low": Unclear or speculative

Only extract items with high or medium confidence. Skip low-confidence items unless they are very important.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(content);
    
    // Validate and normalize the response
    const result: ExtractionResult = {
      actionItems: (parsed.actionItems || []).map((item: any) => ({
        description: item.description || "",
        action_type: validateActionType(item.action_type) || "FOLLOW_UP",
        due_date: item.due_date || undefined,
        notes: item.notes || undefined,
        confidence: validateConfidence(item.confidence) || "medium",
      })),
      insights: (parsed.insights || []).map((insight: any) => ({
        text: insight.text || "",
        confidence: validateConfidence(insight.confidence) || "medium",
      })),
      overallConfidence: validateConfidence(parsed.overallConfidence) || "medium",
      needsReview: parsed.overallConfidence === "low" || (parsed.actionItems || []).some((item: any) => item.confidence === "low"),
    };

    return result;
  } catch (error) {
    console.error("Error extracting interactions:", error);
    // Return empty result with low confidence on error
    return {
      actionItems: [],
      insights: [],
      overallConfidence: "low",
      needsReview: true,
    };
  }
}

/**
 * Build the extraction prompt
 */
function buildExtractionPrompt(meetingNotes: string, relationshipName: string): string {
  return `Extract action items and insights from the following meeting notes/transcript for ${relationshipName}:

${meetingNotes}

Please identify:
1. All action items that need to be completed (who should do them, when if mentioned)
2. Key insights, decisions, opportunities, or important context

Return the result as JSON with the structure specified in the system message.`;
}

/**
 * Validate action type
 */
function validateActionType(type: string): ActionType | null {
  const validTypes: ActionType[] = [
    "OUTREACH",
    "FOLLOW_UP",
    "NURTURE",
    "CALL_PREP",
    "POST_CALL",
    "CONTENT",
    "FAST_WIN",
  ];
  return validTypes.includes(type as ActionType) ? (type as ActionType) : null;
}

/**
 * Validate confidence level
 */
function validateConfidence(confidence: string): "high" | "medium" | "low" | null {
  const validLevels = ["high", "medium", "low"];
  return validLevels.includes(confidence) ? (confidence as "high" | "medium" | "low") : null;
}

