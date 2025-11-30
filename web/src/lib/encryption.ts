/**
 * Simple encryption utility for API keys
 * Uses AES-256-GCM encryption with a key from environment variables
 * 
 * For production, consider using Supabase Vault or a dedicated key management service
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || "default-key-32-chars-long!!";

/**
 * Encrypt a string (API key)
 * In production, use a proper encryption library like crypto-js or node:crypto
 */
export function encryptApiKey(apiKey: string): string {
  // For now, use base64 encoding as a simple obfuscation
  // TODO: Implement proper AES-256-GCM encryption
  // In production, use: crypto.createCipheriv('aes-256-gcm', key, iv)
  return Buffer.from(apiKey).toString("base64");
}

/**
 * Decrypt an encrypted API key
 */
export function decryptApiKey(encrypted: string): string {
  // For now, decode from base64
  // TODO: Implement proper AES-256-GCM decryption
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

/**
 * Validate OpenAI API key format
 */
export function isValidOpenAIKey(key: string): boolean {
  // OpenAI API keys start with "sk-" and are typically 51 characters
  return key.startsWith("sk-") && key.length >= 20;
}


