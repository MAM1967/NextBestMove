import { createHash } from "crypto";

/**
 * Hash an email address using SHA-256
 * Privacy-first: Store hashed addresses instead of raw addresses
 */
export function hashEmailAddress(email: string): string {
  const normalized = email.toLowerCase().trim();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Extract email address from various formats
 * Handles: "Name <email@example.com>", "email@example.com", etc.
 */
export function extractEmailAddress(emailString: string): string {
  const match = emailString.match(/<(.+?)>|([^\s<>]+@[^\s<>]+)/);
  if (match) {
    return (match[1] || match[2] || "").toLowerCase().trim();
  }
  return emailString.toLowerCase().trim();
}

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}




