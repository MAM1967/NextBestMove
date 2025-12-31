import type { EmailProvider } from "./providers";
import { getEmailAccessToken } from "./tokens";

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      parts?: Array<{ mimeType: string; body: { data?: string } }>;
    }>;
  };
  internalDate: string;
}

export interface GmailMessageListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

/**
 * Fetch recent messages from Gmail API
 */
export async function fetchGmailMessages(
  userId: string,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  const accessToken = await getEmailAccessToken(userId, "gmail");
  if (!accessToken) {
    throw new Error("No valid access token for Gmail");
  }

  // First, get list of message IDs
  // Fetch emails from last 90 days (1 quarter) to capture less frequent relationships
  // Relationships represent <5% of email volume, so we need to go back further
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFilter = ninetyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", maxResults.toString());
  listUrl.searchParams.set("q", `in:inbox after:${dateFilter}`); // Only inbox messages from last 90 days

  const listResponse = await fetch(listUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Gmail API error: ${listResponse.statusText}`);
  }

  const listData: GmailMessageListResponse = await listResponse.json();

  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch full message details with proper rate limiting
  // Based on Gmail API official limits:
  // - Per-user rate limit: 250 quota units/second (moving average)
  // - messages.get consumes 5 quota units each
  // - Maximum: 50 requests/second (250/5)
  // - We limit to 40 requests/second for safety margin (~25ms between requests)
  // Reference: https://developers.google.com/workspace/gmail/api/reference/quota
  const messages: GmailMessage[] = [];
  const REQUESTS_PER_SECOND = 40;
  const DELAY_MS = 1000 / REQUESTS_PER_SECOND; // ~25ms between requests
  
  /**
   * Fetch a single message with exponential backoff retry
   */
  async function fetchMessageWithRetry(
    messageId: string,
    maxRetries: number = 3
  ): Promise<GmailMessage | null> {
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await fetch(messageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return response.json() as Promise<GmailMessage>;
      }

      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        // Check for Retry-After header
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter 
          ? parseInt(retryAfter, 10) * 1000 
          : Math.min(1000 * Math.pow(2, attempt), 8000); // Exponential backoff: 1s, 2s, 4s, max 8s
        
        if (attempt < maxRetries - 1) {
          console.warn(`Gmail rate limited for message ${messageId}, retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Other errors - log and return null
      console.error(`Failed to fetch Gmail message ${messageId}:`, response.status, response.statusText);
      return null;
    }

    return null;
  }

  // Fetch messages sequentially with rate limiting
  // This ensures we stay under 40 requests/second
  for (const msg of listData.messages) {
    const message = await fetchMessageWithRetry(msg.id);
    if (message) {
      messages.push(message);
    }
    
    // Rate limit: wait between requests to stay under 40/sec
    if (messages.length < listData.messages.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return messages;
}

/**
 * Extract email metadata from Gmail message
 */
export function extractGmailMetadata(message: GmailMessage) {
  const headers = message.payload.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = getHeader("From");
  const to = getHeader("To");
  const subject = getHeader("Subject");
  const date = getHeader("Date");

  return {
    messageId: message.id,
    threadId: message.threadId,
    from,
    to,
    subject,
    snippet: message.snippet || "",
    receivedAt: date ? new Date(date).toISOString() : new Date(message.internalDate).toISOString(),
  };
}




