import OpenAI from "openai";
import { decryptApiKey } from "@/lib/encryption";

/**
 * Initialize OpenAI client with system API key
 * Falls back gracefully if API key is not configured
 */
export function getSystemOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not configured, AI features will use templates only");
    return null;
  }
  return new OpenAI({ apiKey });
}

/**
 * Initialize OpenAI client with user's API key (BYOK)
 * @param encryptedApiKey - Encrypted API key from database
 */
export function getUserOpenAIClient(encryptedApiKey: string): OpenAI | null {
  try {
    const apiKey = decryptApiKey(encryptedApiKey);
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error("Failed to decrypt user API key:", error);
    return null;
  }
}

/**
 * Get OpenAI client for a user (BYOK or system fallback)
 * @param userAiProvider - 'system' or 'openai'
 * @param userApiKeyEncrypted - Encrypted user API key (if BYOK)
 */
export function getOpenAIClientForUser(
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null
): OpenAI | null {
  // If user has BYOK configured, use their key
  if (userAiProvider === "openai" && userApiKeyEncrypted) {
    const client = getUserOpenAIClient(userApiKeyEncrypted);
    if (client) {
      return client;
    }
    // Fallback to system if user key fails
    console.warn("User API key failed, falling back to system key");
  }

  // Default to system key
  return getSystemOpenAIClient();
}

/**
 * Generate content using OpenAI with a template-based prompt
 * Falls back to template if AI fails or is unavailable
 */
export async function generateWithAI(
  template: string,
  context: Record<string, unknown>,
  fallback: string,
  userAiProvider?: string | null,
  userApiKeyEncrypted?: string | null,
  userModel?: string | null
): Promise<string> {
  const client = getOpenAIClientForUser(userAiProvider, userApiKeyEncrypted);
  if (!client) {
    return fallback;
  }

  try {
    const prompt = buildPrompt(template, context);
    const model = userModel || "gpt-4o-mini"; // Use user's model or default
    
    const response = await client.chat.completions.create({
      model,
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
function buildPrompt(template: string, context: Record<string, unknown>): string {
  let prompt = template;
  for (const [key, value] of Object.entries(context)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return prompt;
}

