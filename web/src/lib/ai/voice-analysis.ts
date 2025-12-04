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
 * Collect user-written text samples for voice analysis
 * Sources: edited content prompts, action notes, pin notes
 */
export async function collectUserTextSamples(
  supabase: SupabaseClient,
  userId: string,
  minSamples: number = 5
): Promise<string[]> {
  const samples: string[] = [];

  // 1. Get edited content prompts (prefer longer ones)
  const { data: editedPrompts } = await supabase
    .from("content_prompts")
    .select("edited_text")
    .eq("user_id", userId)
    .eq("user_edited", true)
    .not("edited_text", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (editedPrompts) {
    for (const prompt of editedPrompts) {
      if (prompt.edited_text && prompt.edited_text.trim().length > 50) {
        samples.push(prompt.edited_text.trim());
      }
    }
  }

  // 2. Get action notes (prefer longer ones)
  const { data: actions } = await supabase
    .from("actions")
    .select("notes")
    .eq("user_id", userId)
    .not("notes", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (actions) {
    for (const action of actions) {
      if (action.notes && action.notes.trim().length > 50) {
        samples.push(action.notes.trim());
      }
    }
  }

  // 3. Get pin notes (prefer longer ones)
  const { data: pins } = await supabase
    .from("person_pins")
    .select("notes")
    .eq("user_id", userId)
    .not("notes", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (pins) {
    for (const pin of pins) {
      if (pin.notes && pin.notes.trim().length > 50) {
        samples.push(pin.notes.trim());
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

