import OpenAI from "openai";

/**
 * Initialize OpenAI client
 * Falls back gracefully if API key is not configured
 */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not configured, AI features will use templates only");
    return null;
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate content using OpenAI with a template-based prompt
 * Falls back to template if AI fails or is unavailable
 */
export async function generateWithAI(
  template: string,
  context: Record<string, any>,
  fallback: string
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    return fallback;
  }

  try {
    const prompt = buildPrompt(template, context);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency, can upgrade to gpt-4 if needed
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, engaging LinkedIn-style content. Keep responses to 3-6 sentences. Be authentic and conversational.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200, // Limit to keep responses concise
      temperature: 0.7, // Balance creativity and consistency
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (content && content.length > 0) {
      return content;
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
  }

  // Fallback to template if AI fails
  return fallback;
}

/**
 * Build a prompt from a template and context
 */
function buildPrompt(template: string, context: Record<string, any>): string {
  let prompt = template;
  for (const [key, value] of Object.entries(context)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return prompt;
}

