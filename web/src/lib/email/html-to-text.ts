/**
 * Simple HTML-to-text converter for email bodies
 * Strips HTML tags and decodes HTML entities
 */

/**
 * Convert HTML email body to plain text
 * Removes HTML tags, decodes entities, and cleans up whitespace
 */
export function htmlToText(html: string): string {
  if (!html) return "";

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&hellip;": "...",
    "&mdash;": "—",
    "&ndash;": "–",
  };

  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, "gi"), replacement);
  }

  // Decode numeric entities (&#123; or &#x1F;)
  text = text.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Clean up whitespace
  text = text
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/\n\s*\n/g, "\n\n") // Multiple newlines to double
    .trim();

  return text;
}

