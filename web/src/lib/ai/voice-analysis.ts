import { getOpenAIClientForUser } from "./openai";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface VoiceCharacteristics {
  tone: string;
  formality: string;
  sentence_length: string;
  vocabulary_level: string;
  common_phrases: string[];
  writing_patterns: {
    greeting_style?: string;
    closing_style?: string;
    punctuation_preference?: string;
  };
  topics?: string[];
  sample_texts?: string[];
}

/**
 * Count user-written text samples available for voice analysis
 * Fast version that only counts, doesn't fetch full text
 */
export async function countUserTextSamples(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // Run all queries in parallel for better performance
  const [promptsResult, actionsResult, pinsResult, manualSamplesResult] = await Promise.all([
    // Count edited content prompts with length > 50
    supabase
      .from("content_prompts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("user_edited", true)
      .not("edited_text", "is", null),
    
    // Count action notes with length > 50
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("notes", "is", null),
    
    // Count pin notes with length > 50
    supabase
      .from("person_pins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("notes", "is", null),
    
    // Count manual voice samples
    supabase
      .from("manual_voice_samples")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // Note: We can't filter by length > 50 at the database level easily with Supabase
  // So we'll fetch a reasonable limit and filter in memory, but only for counting
  // For actual sample collection, we still need the full text
  const promptCount = promptsResult.count || 0;
  const actionCount = actionsResult.count || 0;
  const pinCount = pinsResult.count || 0;
  const manualCount = manualSamplesResult.count || 0;

  // Return total count (we'll filter by length when actually collecting samples)
  return promptCount + actionCount + pinCount + manualCount;
}

/**
 * Collect user-written text samples for voice analysis
 * Sources: edited content prompts, action notes, pin notes
 */
export async function collectUserTextSamples(
  supabase: SupabaseClient,
  userId: string,
  minSamples: number = 5
): Promise<string[]> {
  const samples: string[] = [];

  // Run queries in parallel for better performance
  const [editedPromptsResult, actionsResult, pinsResult, manualSamplesResult] = await Promise.all([
    // 1. Get edited content prompts (prefer longer ones)
    supabase
      .from("content_prompts")
      .select("edited_text")
      .eq("user_id", userId)
      .eq("user_edited", true)
      .not("edited_text", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    
    // 2. Get action notes (prefer longer ones)
    supabase
      .from("actions")
      .select("notes")
      .eq("user_id", userId)
      .not("notes", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    
    // 3. Get pin notes (prefer longer ones)
    supabase
      .from("person_pins")
      .select("notes")
      .eq("user_id", userId)
      .not("notes", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    
    // 4. Get manual voice samples (emails, LinkedIn posts, etc.)
    supabase
      .from("manual_voice_samples")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Process edited prompts
  if (editedPromptsResult.data) {
    for (const prompt of editedPromptsResult.data) {
      if (prompt.edited_text && prompt.edited_text.trim().length > 50) {
        samples.push(prompt.edited_text.trim());
      }
    }
  }

  // Process action notes
  if (actionsResult.data) {
    for (const action of actionsResult.data) {
      if (action.notes && action.notes.trim().length > 50) {
        samples.push(action.notes.trim());
      }
    }
  }

  // Process pin notes
  if (pinsResult.data) {
    for (const pin of pinsResult.data) {
      if (pin.notes && pin.notes.trim().length > 50) {
        samples.push(pin.notes.trim());
      }
    }
  }

  // Process manual voice samples (already validated to be >= 50 chars in DB)
  if (manualSamplesResult.data) {
    for (const sample of manualSamplesResult.data) {
      if (sample.content && sample.content.trim().length > 50) {
        samples.push(sample.content.trim());
      }
    }
  }

  // Return up to 20 samples (most recent)
  return samples.slice(0, 20);
}

/**
 * Analyze user's writing style using OpenAI
 * Returns voice characteristics JSONB structure
 */
export async function analyzeVoiceStyle(
  samples: string[],
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null,
  userModel?: string | null
): Promise<VoiceCharacteristics | null> {
  if (samples.length < 5) {
    return null; // Need at least 5 samples
  }

  const client = getOpenAIClientForUser(userAiProvider, userApiKeyEncrypted);
  if (!client) {
    return null;
  }

  // Combine samples for analysis
  const combinedText = samples.join("\n\n---\n\n");

  const analysisPrompt = `Analyze the writing style of the following text samples and provide a JSON response with the following structure:

{
  "tone": "professional-friendly" | "casual" | "formal" | "conversational" | "enthusiastic" | etc.,
  "formality": "formal" | "semi-formal" | "casual",
  "sentence_length": "short" | "medium" | "long",
  "vocabulary_level": "simple" | "intermediate" | "advanced",
  "common_phrases": ["array", "of", "phrases", "used", "frequently"],
  "writing_patterns": {
    "greeting_style": "warm" | "professional" | "casual" | "direct",
    "closing_style": "professional" | "warm" | "casual" | "direct",
    "punctuation_preference": "standard" | "minimal" | "expressive"
  },
  "topics": ["array", "of", "common", "topics"],
  "sample_texts": ["up to 3 representative samples"]
}

Text samples to analyze:
${combinedText}

Provide only the JSON response, no additional text.`;

  try {
    const model = userModel || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a writing style analyst. Analyze text samples and return a JSON object describing the writing style. Be specific and accurate.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return null;
    }

    // Parse JSON response
    const characteristics = JSON.parse(content) as VoiceCharacteristics;

    // Validate structure
    if (
      !characteristics.tone ||
      !characteristics.formality ||
      !characteristics.sentence_length ||
      !characteristics.vocabulary_level ||
      !Array.isArray(characteristics.common_phrases)
    ) {
      return null;
    }

    // Add sample texts (up to 3)
    characteristics.sample_texts = samples.slice(0, 3);

    return characteristics;
  } catch (error) {
    console.error("Voice analysis error:", error);
    return null;
  }
}

/**
 * Build voice profile prompt context for content generation
 */
export function buildVoiceProfilePrompt(characteristics: VoiceCharacteristics): string {
  const parts: string[] = [];

  parts.push(`Tone: ${characteristics.tone}`);
  parts.push(`Formality: ${characteristics.formality}`);
  parts.push(`Sentence length: ${characteristics.sentence_length}`);
  parts.push(`Vocabulary level: ${characteristics.vocabulary_level}`);

  if (characteristics.common_phrases.length > 0) {
    parts.push(`Common phrases: ${characteristics.common_phrases.slice(0, 5).join(", ")}`);
  }

  if (characteristics.writing_patterns) {
    if (characteristics.writing_patterns.greeting_style) {
      parts.push(`Greeting style: ${characteristics.writing_patterns.greeting_style}`);
    }
    if (characteristics.writing_patterns.closing_style) {
      parts.push(`Closing style: ${characteristics.writing_patterns.closing_style}`);
    }
  }

  return parts.join("\n");
}

